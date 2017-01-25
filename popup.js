
function updateStatus()
{
	var background = chrome.extension.getBackgroundPage();
	background.getCurrentTabTimes(function(page, site, tab, siteTotal) {
		document.getElementById('page').textContent = createTimeMessage(page);
		document.getElementById('site').textContent = createTimeMessage(site);
		document.getElementById('tab').textContent = createTimeMessage(tab);
		document.getElementById('siteTotal').textContent = createTimeMessage(siteTotal);
	});
}

function createTimeMessage(seconds) {
	if(!seconds) {
		return "Not Available";
	}
	var min = Math.floor((seconds / 60) % 60);
	var sec = Math.floor(seconds % 60);
	var hour = Math.floor((seconds / 60 / 60) % 24);
	var day = Math.floor(seconds / 60 / 60 / 24);
	
	var msg;
	var color;
	//update UI
	if(day > 0)
	{
		msg = day + " Day";
	}
	else if(hour > 0)
	{
		msg = hour + " Hour";
	}
	else if(min > 0)
	{
		msg = min + " Minute";
	}
	else
	{
		msg = sec + " Second";
	}
	
	return msg;
}

document.addEventListener('DOMContentLoaded', function() {
  updateStatus();
});

