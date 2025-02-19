import React from "react";
import { Checkbox, Modal, Table, Tabs } from "antd";
import { observer } from "mobx-react";

import { Hotkey } from "../../core/Hotkey";

import "./Settings.styl";
import { Block, Elem } from "../../utils/bem";
import { triggerResizeEvent } from "../../utils/utilities";

const HotkeysDescription = () => {
  const columns = [
    { title: "Shortcut", dataIndex: "combo", key: "combo" },
    { title: "Description", dataIndex: "descr", key: "descr" },
  ];

  const keyNamespaces = Hotkey.namespaces();

  const getData = (descr) => Object.keys(descr)
    .filter(k => descr[k])
    .map(k => ({
      key: k,
      combo: k.split(",").map(keyGroup => {
        return (
          <Elem name="key-group" key={keyGroup}>
            {keyGroup.trim().split("+").map((k) => <Elem tag="kbd" name="key" key={k}>{k}</Elem>)}
          </Elem>
        );
      }),
      descr: descr[k],
    }));

  return (
    <Block name="keys">
      <Tabs size="small">
        {Object.entries(keyNamespaces).map(([ns, data]) => {
          if (Object.keys(data.descriptions).length === 0) {
            return null;
          } else {
            return (
              <Tabs.TabPane key={ns} tab={data.description ?? ns}>
                <Table columns={columns} dataSource={getData(data.descriptions)} size="small" />
              </Tabs.TabPane>
            );
          }
        })}
      </Tabs>
    </Block>
  );
};

export default observer(({ store }) => {
  return (
    <Modal
      visible={store.showingSettings}
      title="Settings"
      bodyStyle={{ paddingTop: "0" }}
      footer=""
      onCancel={store.toggleSettings}
    >
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="General" key="1">
          <Checkbox
            checked={store.settings.enableHotkeys}
            onChange={() => {
              store.settings.toggleHotkeys();
            }}
          >
            Enable labeling hotkeys
          </Checkbox>
          <br />
          <Checkbox
            checked={store.settings.enableTooltips}
            onChange={() => {
              store.settings.toggleTooltips();
            }}
          >
            Show hotkey tooltips
          </Checkbox>
          <br />
          <Checkbox
            checked={store.settings.enableLabelTooltips}
            onChange={() => {
              store.settings.toggleLabelTooltips();
            }}
          >
            Show labels hotkey tooltips
          </Checkbox>
          <br />
          <Checkbox
            checked={store.settings.showLabels}
            onChange={() => {
              store.settings.toggleShowLabels();
            }}
          >
            Show labels inside the regions
          </Checkbox>
          {/* <br/> */}
          {/* <Checkbox */}
          {/*   value="Show scores inside the regions" */}
          {/*   defaultChecked={store.settings.showScore} */}
          {/*   onChange={() => { */}
          {/*     store.settings.toggleShowScore(); */}
          {/*   }} */}
          {/* > */}
          {/*   Show scores inside the regions */}
          {/* </Checkbox> */}

          <br />
          <Checkbox
            checked={store.settings.continuousLabeling}
            onChange={() => {
              store.settings.toggleContinuousLabeling();
            }}
          >
            Keep label selected after creating a region
          </Checkbox>

          <br />
          <Checkbox checked={store.settings.selectAfterCreate} onChange={store.settings.toggleSelectAfterCreate}>
            Select regions after creating
          </Checkbox>

          <br />
          <Checkbox checked={store.settings.showLineNumbers} onChange={store.settings.toggleShowLineNumbers}>
            Show line numbers for Text
          </Checkbox>

          {/* <br /> */}
          {/* <Checkbox */}
          {/*   value="Enable auto-save" */}
          {/*   defaultChecked={store.settings.enableAutoSave} */}
          {/*   onChange={() => { */}
          {/*     store.settings.toggleAutoSave(); */}
          {/*   }} */}
          {/* > */}
          {/*   Enable auto-save */}

          {/* </Checkbox> */}
          {/* { store.settings.enableAutoSave && */}
          {/*   <div style={{ marginLeft: "1.7em" }}> */}
          {/*     Save every <InputNumber size="small" min={5} max={120} /> seconds */}
          {/*   </div> } */}
        </Tabs.TabPane>
        <Tabs.TabPane tab="Hotkeys" key="2">
          <HotkeysDescription />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Layout" key="3">
          <Checkbox
            checked={store.settings.bottomSidePanel}
            onChange={() => {
              store.settings.toggleBottomSP();
              setTimeout(triggerResizeEvent);
            }}
          >
            Move sidepanel to the bottom
          </Checkbox>

          <br />
          <Checkbox checked={store.settings.displayLabelsByDefault} onChange={store.settings.toggleSidepanelModel}>
            Display Labels by default in Results panel
          </Checkbox>

          <br />
          <Checkbox
            value="Show Annotations panel"
            defaultChecked={store.settings.showAnnotationsPanel}
            onChange={() => {
              store.settings.toggleAnnotationsPanel();
            }}
          >
            Show Annotations panel
          </Checkbox>
          <br />
          <Checkbox
            value="Show Predictions panel"
            defaultChecked={store.settings.showPredictionsPanel}
            onChange={() => {
              store.settings.togglePredictionsPanel();
            }}
          >
            Show Predictions panel
          </Checkbox>

          {/* <br/> */}
          {/* <Checkbox */}
          {/*   value="Show image in fullsize" */}
          {/*   defaultChecked={store.settings.imageFullSize} */}
          {/*   onChange={() => { */}
          {/*     store.settings.toggleImageFS(); */}
          {/*   }} */}
          {/* > */}
          {/*   Show image in fullsize */}
          {/* </Checkbox> */}
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
});
