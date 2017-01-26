var currentActiveTabId;
var currentActiveWindowId;

var activeWindowTabMap = {};;
var siteTimeMap = {};
var tabDictionary = {};


var updateIntervalInSec = 10;
var red = [237,28,36,255];
var green = [181,230,29,255];
var blue = [0,162,232,255];
var debug = true;

//function debug(msg) { variable and functions name cannot be same.
function debugMessage(msg) {
	if(debug) {
		console.log(msg);
	}
}

function TabData()
{
	this.CurrentPageURL = ""
	this.CurrentPageTimeInSec = 0;
	this.TabTimeInSec = 0;
	this.WebSiteURL = ""
	this.WebSiteTimeInSec = 0;
	this.LastStartTime = new Date();
	
	this.AddPageTime = function(timeInSec) {
		this.CurrentPageTimeInSec += timeInSec;
	}
	
	this.SetPageTime = function(timeInSec) {
		this.CurrentPageTimeInSec = timeInSec;
	}
	
	this.AddSiteTime = function(timeInSec) {
		this.WebSiteTimeInSec += timeInSec;
		
		var t = siteTimeMap[this.WebSiteURL];
		if(!t) {
			t = 0;
		}
		siteTimeMap[this.WebSiteURL] =  t + timeInSec;
	}
	
	this.SetSiteTime = function(timeInSec) {
		this.WebSiteTimeInSec = timeInSec;
	}
	
	this.AddTabTime = function(timeInSec) {
		this.TabTimeInSec += timeInSec;
	}
	
	this.UpdatePageAndSiteTimeTillNow = function() {
		var diff = (new Date().getTime() - this.LastStartTime.getTime()) / 1000;
		this.AddPageTime(diff);
		this.AddSiteTime(diff);
		this.AddTabTime(diff);
	}
}



function updateBadge(seconds)
{
	var min = Math.floor((seconds / 60) % 60);
	var sec = Math.floor(seconds % 60);
	var hour = Math.floor((seconds / 60 / 60) % 24);
	var day = Math.floor(seconds / 60 / 60 / 24);
	var msg;
	var color;
	//update UI
	if(day > 0)
	{
		msg = day + " D";
		color = red;
	}
	else if(hour > 0)
	{
		msg = hour + " H";
		color = red;
	}
	else if(min > 0)
	{
		msg = min + " M";
		color = blue;
	}
	else
	{
		msg = sec + " S";
		color = green;
	}
	chrome.browserAction.setBadgeText({text: ""+msg});
	chrome.browserAction.setBadgeBackgroundColor({color: color });
}

function getCurrentTabId(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
	var tab = tabs[0];
	if(tab) {
		//console.assert(tab.id === currentActiveTabId, {"message":"current tab =" + tab.id + " from local var = " + currentActiveTabId });
		callback(tab.id);
	}
	else {
		// no windows is focused!
		callback(null);
	}
  });
}

//callback(pageTime, siteTime, tabTime)
function getCurrentTabTimes(callback) {

  getCurrentTabId( function(tabId)  {
		var tabData = tabDictionary[tabId];
		if(tabData)
		{
			debugMessage("current page time in sec" + tabData.CurrentPageTimeInSec);
			callback(tabData.CurrentPageTimeInSec, tabData.WebSiteTimeInSec, tabData.TabTimeInSec, siteTimeMap[tabData.WebSiteURL]);
		}
	});
}

function getCurrentTabPageTime(callback) {

  getCurrentTabId( function(tabId)  {
		var tabData = tabDictionary[tabId];
		if(tabData)
		{
			debugMessage("current page time in sec" + tabData.CurrentPageTimeInSec);
			callback(tabData.CurrentPageTimeInSec);
		}
	});
}

chrome.tabs.onCreated.addListener(function(tab) {
	//debugMessage("tab created, tab id" + tab.id );
	
	//Create new Tab Object
	var newTab = new TabData();
	newTab.CurrentPageURL = tab.url;
	newTab.WebSiteURL = new URL(tab.url).hostname;
	
	//put it in disctionary.
	tabDictionary[tab.id] = newTab;
	activeWindowTabMap[currentActiveWindowId] = tab.id;

	updateBadge(0);
});


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    //debugMessage("onUpdated " + tab.url +" , " + tab.id);
	
	var tabData = tabDictionary[tab.id];
	
	if(!tabData)
	{
		tabData = new TabData();
		tabData.CurrentPageURL = tab.url;
		tabData.WebSiteURL = new URL(tab.url).hostname;
	
		//put it in dictionary.
		tabDictionary[tab.id] = tabData;
	}

	if(tabData.CurrentPageURL.toUpperCase() !== tab.url.toUpperCase())
	{
		//update page url
		debugMessage("tab old url " + tabData.CurrentPageURL +"  new URL " + tab.url);
		tabData.CurrentPageURL = tab.url;
		tabData.SetPageTime(0);
	}
	
	if(new URL(tab.url).hostname.toLocaleLowerCase() !== tabData.WebSiteURL.toLocaleLowerCase())
	{
		//update website
		debugMessage("tab old host " + tabData.WebSiteURL +"  new host " + new URL(tab.url).hostname);
		tabData.WebSiteURL = new URL(tab.url).hostname;
		tabData.SetSiteTime(0);
	}
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
   debugMessage("onActivated "  + activeInfo.tabId);
   
   if(currentActiveWindowId) {
	activeWindowTabMap[currentActiveWindowId] = activeInfo.tabId;
   } 
   else {
	   //console.assert(false, {"message":"current window id is empty!" });
   }
   
   if(currentActiveTabId)
   {
	   debugMessage("Last active tab id " + currentActiveTabId);
	    var lastTabData = tabDictionary[currentActiveTabId];
		if(lastTabData)
		{
			debugMessage("Update last tab data.");
			lastTabData.UpdatePageAndSiteTimeTillNow();
		}
   }

   currentActiveTabId = activeInfo.tabId;
   var tabData = tabDictionary[activeInfo.tabId];
   if(!tabData)
	{
		chrome.tabs.get(activeInfo.tabId, function(tab){
			tabData = new TabData();
			tabData.CurrentPageURL = tab.url;
			tabData.WebSiteURL = new URL(tab.url).hostname;
		
			//put it in dictionary.
			tabDictionary[tab.id] = tabData;
			
			updateBadge(tabData.CurrentPageTimeInSec);
		});
	}
	else
	{
		tabData.LastStartTime = new Date();
		updateBadge(tabData.CurrentPageTimeInSec);
	}
});

//chrome.tabs.onHighlighted.addListener(function(highlightInfo) {
//    debugMessage("onHighlighted " + highlightInfo.tabIds.join(","));
//});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    debugMessage("onRemoved " + tabId + " ,isWindowClosing:", removeInfo.isWindowClosing);
	delete tabDictionary[tabId];
	if(removeInfo.isWindowClosing) {
		//TODO: remove window from map
	}
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    debugMessage("sent from tab.id=", request.from);
});

chrome.windows.onFocusChanged.addListener(function (windowId) {
	if(windowId ===  chrome.windows.WINDOW_ID_NONE) {
		debugMessage("windows lost focus ");
		if(currentActiveTabId) {
			debugMessage("windows lost focus ,Last active tab id " + currentActiveTabId);
			var lastTabData = tabDictionary[currentActiveTabId];
			if(lastTabData)
			{
				debugMessage("windows lost focus, Update last tab data.");
				lastTabData.UpdatePageAndSiteTimeTillNow();
				lastTabData.LastStartTime = new Date();
			}
		}
		currentActiveWindowId = null;
		currentActiveTabId = null;
	}
	else {
		debugMessage("current active window id " + windowId);
		currentActiveWindowId = windowId;
		getCurrentTabId(function (tabId) {
			currentActiveTabId = tabId;
			
		});
	}
});

setInterval(function(){
		debugMessage("Timer running");
		getCurrentTabId( function(tabId) {
			if(tabId) {
				//debugMessage("Timer: get current tab id");
				var tabData = tabDictionary[tabId];
				if(tabData) {
					debugMessage("Update tab data.");
					tabData.UpdatePageAndSiteTimeTillNow();
					tabData.LastStartTime = new Date();

					updateBadge(tabData.CurrentPageTimeInSec);
				}
			}
			else {
				// no window is active.
				//debugMessage("Time: empty current tab id");
			}
		});
	}, updateIntervalInSec*1000);