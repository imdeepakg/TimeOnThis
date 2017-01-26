
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
	//0 is a falsey value
	//http://stackoverflow.com/questions/7615214/in-javascript-why-is-0-equal-to-false-but-when-tested-by-if-it-is-not-fals
	//http://stackoverflow.com/questions/5515310/is-there-a-standard-function-to-check-for-null-undefined-or-blank-variables-in
	if(seconds === undefined || seconds === null) {
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
	else {
		if(hour > 9) {
			msg = hour + ":";
		}
		else {
			msg = "0" + hour + ":";
		}
		
		if(min > 9) {
			msg += min + ":";
		}
		else {
			msg += "0" + min + ":";
		}

		if(sec > 9) {
			msg += sec;
		}
		else {
			msg += "0" + sec;
		}
	}
	
	return msg;
}

document.addEventListener('DOMContentLoaded', function() {
  updateStatus();
});

