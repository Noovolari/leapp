var electronTabs = require("electron-tabs");
(function() {
  // Select tab-group
  var tabGroup = document.getElementById("tabs");
  var ipc = require("electron").ipcRenderer;
  var sessionId = -1;

  ipc.on("TAB_URL", (_, data ) => {
    tabGroup.addTab({
      title: data.title,
      src: data.url,
    })
    sessionId = data.sessionId;
  });

  tabGroup.on("tab-added", (tab, tabGroup) => {
    tab.on("active", (tab) => {
      tab.show();
    });

    var tmpWebview = tab.webview.cloneNode(true);
    tmpWebview.setAttribute("partition", `persist:tab-browser-${sessionId}`);
    tmpWebview.setAttribute("class", `view visible`);

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
