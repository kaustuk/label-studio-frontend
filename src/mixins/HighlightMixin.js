import { getRoot, types } from "mobx-state-tree";

import Utils from "../utils";
import { guidGenerator } from "../utils/unique";
import Constants, { defaultStyle } from "../core/Constants";

export const HighlightMixin = types
  .model()
  .volatile(()  =>({
    _highlightedText: "",
  }))
  .views(self => ({
    get _hasSpans() {
      return self._spans ? (
        self._spans.every(span => span.isConnected)
      ) : false;
    },
    get highlightedText() {
      return self.text || self._highlightedText;
    },
  }))
  .actions(self => ({
    /**
     * Create highlights from the stored `Range`
     */
    applyHighlight() {
      if (self.parent.isLoaded === false) return;
      // Avoid calling this method twice
      // spans in iframe disappear on every annotation switch, so check for it
      // in iframe spans still isConnected, but window is missing
      if (self._hasSpans && self._spans[0]?.ownerDocument?.defaultView) {
        console.warn("Spans already created");
        return;
      }

      const range = self.rangeFromGlobalOffset();
      const root = self._getRootNode();

      // Avoid rendering before view is ready
      if (!range) {
        console.warn("No range found to highlight");
        return;
      }

      if (!root) return;

      const labelColor = self.getLabelColor();
      const identifier = guidGenerator(5);
      const stylesheet = createSpanStylesheet(root.ownerDocument, identifier, labelColor);

      self._stylesheet = stylesheet;
      self._spans = Utils.Selection.highlightRange(range, {
        classNames: ["htx-highlight", stylesheet.className],
        label: self.getLabels(),
      });

      return self._spans;
    },

    updateHighlightedText() {
      if (!self.text) {
        // Concatinating of spans' innerText is up to 10 times faster, but loses "\n"
        const range = self.rangeFromGlobalOffset();
        const root = self._getRootNode();

        if (!range || !root) {
          return;
        }
        const selection = root.ownerDocument.defaultView.getSelection();

        selection.removeAllRanges();
        selection.addRange(range);
        self._highlightedText = String(selection);
        selection.removeAllRanges();

      }
    },

    updateSpans() {
      if (self._hasSpans) {
        const lastSpan = self._spans[self._spans.length - 1];

        lastSpan.setAttribute("data-label", self.getLabels());
      }
    },

    /**
     * Removes current highlights
     */
    removeHighlight() {
      Utils.Selection.removeRange(self._spans);
    },

    /**
     * Update region's appearance if the label was changed
     */
    updateAppearenceFromState() {
      if (!self._spans) return;

      const lastSpan = self._spans[self._spans.length - 1];

      self._stylesheet.setColor(self.getLabelColor());
      Utils.Selection.applySpanStyles(lastSpan, { label: "" });
    },

    /**
     * Make current region selected
     */
    selectRegion() {
      self.annotation.setHighlightedNode(self);
      self.annotation.loadRegionState(self);

      self.addClass(stateClass.active);

      const first = self._spans?.[0];

      if (!first) return;

      if (first.scrollIntoViewIfNeeded) {
        first.scrollIntoViewIfNeeded();
      } else {
        first.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    },

    /**
     * Unselect text region
     */
    afterUnselectRegion() {
      self.removeClass(self._stylesheet?.state.active);
    },

    /**
     * Remove stylesheet before removing the highlight itself
     */
    beforeDestroy() {
      try {
        self._stylesheet.remove();
      } catch(e) { /* somthing went wrong */ }
    },

    /**
     * Set cursor style of the region
     * @param {import("prettier").CursorOptions} cursor
     */
    setCursor(cursor) {
      self._stylesheet.setCursor(cursor);
    },

    /**
     * Draw region outline
     * @param {boolean} val
     */
    setHighlight(val) {
      if (!self._stylesheet) return;

      self._highlighted = val;

      if (self.highlighted) {
        self.addClass(self._stylesheet.state.highlighted);
        self._stylesheet.setCursor(Constants.RELATION_MODE_CURSOR);
      } else {
        self.removeClass(self._stylesheet.state.highlighted);
        self._stylesheet.setCursor(Constants.POINTER_CURSOR);
      }
    },

    getLabels() {
      const settings = getRoot(self).settings;

      if (!self.parent.showlabels && !settings.showLabels) return null;

      return self.labeling?.mainValue ?? [];
    },

    getLabelColor() {
      let labelColor = self.parent.highlightcolor || (self.style || self.tag || defaultStyle).fillcolor;

      if (labelColor) {
        labelColor = Utils.Colors.convertToRGBA(labelColor, 0.3);
      }

      return labelColor;
    },

    find(span) {
      return self._spans && self._spans.indexOf(span) >= 0 ? self : undefined;
    },

    /**
     * Add classes to all spans
     * @param {string[]} classNames
     */
    addClass(classNames) {
      if (!classNames || !self._spans) return;
      const classList = [].concat(classNames); // convert any input to array

      self._spans.forEach(span => span.classList.add(...classList));
    },

    /**
     * Remove classes from all spans
     * @param {string[]} classNames
     */
    removeClass(classNames) {
      if (!classNames || !self._spans) return;
      const classList = [].concat(classNames); // convert any input to array

      self._spans.forEach(span => span.classList.remove(...classList));
    },

    toggleHidden(e) {
      self.hidden = !self.hidden;
      if (self.hidden) {
        self.addClass("__hidden");
      } else {
        self.removeClass("__hidden");
      }

      e?.stopPropagation();
    },
  }));



const stateClass = {
  active: "__active",
  highlighted: "__highlighted",
  collapsed: "__collapsed",
  hidden: "__hidden",
};

/**
 * Creates a separate stylesheet for every region
 * @param {string} identifier GUID identifier of a region
 * @param {string} color Default label color
 */
const createSpanStylesheet = (document, identifier, color) => {
  const className = `.htx-highlight-${identifier}`;
  const variables = {
    color: `--background-color-${identifier}`,
    cursor: `--cursor-style-${identifier}`,
  };

  const classNames = {
    active: `${className}.${stateClass.active}`,
    highlighted: `${className}.${stateClass.highlighted}`,
  };

  const activeColorOpacity = 0.8;
  const toActiveColor = color => Utils.Colors.rgbaChangeAlpha(color, activeColorOpacity);

  const initialActiveColor = toActiveColor(color);

  document.documentElement.style.setProperty(variables.color, color);

  const rules = {
    [className]: `
      background-color: var(${variables.color});
      cursor: var(${variables.cursor}, pointer);
      border: 1px dashed transparent;
    `,
    [`${className}[data-label]::after`]: `
      padding: 2px 2px;
      font-size: 9.5px;
      font-weight: bold;
      font-family: Monaco;
      vertical-align: super;
      content: attr(data-label);
    `,
    [classNames.active]: `
      color: ${Utils.Colors.contrastColor(initialActiveColor)};
      ${variables.color}: ${initialActiveColor}
    `,
    [classNames.highlighted]: `
      position: relative;
      border-color: rgb(0, 174, 255);
    `,
    [`${className}.${stateClass.hidden}`]: `
      border: none;
      background: none;
      padding: 0;
    `,
    [`${className}.${stateClass.hidden}::before`]: `
      display: none
    `,
    [`${className}.${stateClass.hidden}::after`]: `
      display: none
    `,
  };

  const styleTag = document.createElement("style");

  styleTag.type = "text/css";
  styleTag.id = `highlight-${identifier}`;
  document.head.appendChild(styleTag);

  const stylesheet = styleTag.sheet ?? styleTag.styleSheet;
  const supportInserion = !!stylesheet.insertRule;
  let lastRuleIndex = 0;

  for (const ruleName in rules) {
    if (!Object.prototype.hasOwnProperty.call(rules, ruleName)) continue;
    if (supportInserion) stylesheet.insertRule(`${ruleName} { ${rules[ruleName]} } `, lastRuleIndex++);
    else stylesheet.addRule(ruleName, rules);
  }

  /**
   * Set region color
   * @param {string} color
   */
  const setColor = color => {
    const newActiveColor = toActiveColor(color);
    const { style } = stylesheet.rules[2];

    document.documentElement.style.setProperty(variables.color, color);

    style.backgroundColor = newActiveColor;
    style.color = Utils.Colors.contrastColor(newActiveColor);
  };

  /**
   * Ser cursor style
   * @param {import("prettier").CursorOptions} cursor
   */
  const setCursor = cursor => {
    document.documentElement.style.setProperty(variables.cursor, cursor);
  };

  /**
   * Remove stylesheet
   */
  const remove = () => {
    styleTag.remove();
  };

  return {
    className: className.substr(1),
    state: stateClass,
    setColor,
    setCursor,
    remove,
  };
};
