var electronTabs = require("electron-tabs");
(function() {
  // Select tab-group
  var tabGroup = document.getElementById("tabs");
  var index = 0;
  var ipc = require("electron").ipcRenderer;

  ipc.on("TAB_URL", (_, data) => {
    tabGroup.addTab({
      title: data.title,
      src: data.url,
    })
  });

  tabGroup.on("tab-added", (tab, tabGroup) => {
    tab.on("active", (tab) => {
      tab.show();
    });

    var tmpWebview = tab.webview.cloneNode(true);
    tmpWebview.setAttribute("partition", `persist:test${index}`);
    tmpWebview.setAttribute("class", `view visible`);
    index++;

    var views = tab.webview.parentElement;
    views.removeChild(tab.webview);
    for (var i = 0; i < views.children.length; i++) {
      views.children[i].setAttribute("class", `view`);
    }
    views.appendChild(tmpWebview);

    tab.webview = tmpWebview;
    tab.activate();
  });
})();
