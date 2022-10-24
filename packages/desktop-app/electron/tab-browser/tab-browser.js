var electronTabs = require("electron-tabs");
(function() {
  // Select tab-group
  var tabGroup = document.getElementById("tabs");

  tabGroup.setDefaultTab({
    title: "New Page",
    src: "https://signin.aws.amazon.com/federation?Action=login&Issuer=Leapp&Destination=https://eu-west-1.console.aws.amazon.com/console/home?region=eu-west-1&SigninToken=u5Q8An9nWQd2BhsZtkxbZolVN-xYvJvEOzAsl8Td"
  });

  var index = 0;

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
