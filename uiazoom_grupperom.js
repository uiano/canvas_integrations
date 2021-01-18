'use strict';

/**************************************************************************/
/* Create Zoom csv-file for populating breakout room from Canvas groups   */
/* Button in group page /courses/x/groups                                 */
/* Include in override file with something like:                          */
/* if (/\/courses\/.*\/groups/.test(location.pathname)){                  */
/*    $.getScript('https://URL_TO_FILE/zoom_grupperom.js', function(){}); */
/* }                                                                      */
/* Also, change from members[j].login_id if you use another id in zoom    */
/* Created by Tore B. Jørgensen (t.b.jorgensen@link.uia.no)               */
/**************************************************************************/

function uiaZBexportToCsv(filename, rows) {
		var processRow = function (row) {
				var finalVal = '';
				for (var j = 0; j < row.length; j++) {
						var innerValue = row[j] === null ? '' : row[j].toString();
						if (row[j] instanceof Date) {
								innerValue = row[j].toLocaleString();
						};
						var result = innerValue.replace(/"/g, '""');
						if (result.search(/("|,|\n)/g) >= 0)
								result = '"' + result + '"';
						if (j > 0)
								finalVal += ',';
						finalVal += result;
				}
				return finalVal + '\n';
		};

		var csvFile = '';
		for (var i = 0; i < rows.length; i++) {
				csvFile += processRow(rows[i]);
		}

		var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
		if (navigator.msSaveBlob) { // IE 10+
				navigator.msSaveBlob(blob, filename);
		} else {
				var link = document.createElement("a");
				if (link.download !== undefined) { // feature detection
						// Browsers that support HTML5 download attribute
						var url = URL.createObjectURL(blob);
						link.setAttribute("href", url);
						link.setAttribute("download", filename);
						link.style.visibility = 'hidden';
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
				}
		}
}

async function uiaZBCanvasAPIGet (last_part_of_url){
		//Does a Canvas API call and returns a JS-object.
		let response = await fetch(location.origin+'/api/v1/'+last_part_of_url+'?per_page=1000');
		let data = await response.text();
		return JSON.parse(data.substring(9));
}

async function uiaZBbuildArray(groupsetid){
		let ZBlist = [['Pre-assign Room Name','Email Address']];
		let groupset = await uiaZBCanvasAPIGet(`group_categories/${groupsetid}`);
		let groups = await uiaZBCanvasAPIGet(`group_categories/${groupsetid}/groups`);
		for (let i=0; i<groups.length; i++){
				let members = await uiaZBCanvasAPIGet(`groups/${groups[i].id}/users`);
				for (let j=0; j<members.length; j++){
					  /************************************************************************************************************************/
						/* Depending on your username in Zoom and identical id in Canvas, you might want to change the line below from login_id */
						/************************************************************************************************************************/
						ZBlist.push([groups[i].name,members[j].login_id]);
				}
		}
		uiaZBexportToCsv(`zoom_breakout_${groupset.name}.csv`,ZBlist);
}
function uiaZBcreateCSV(event){
		uiaZBbuildArray(this.value);
}

function uiaZBaddButtons(){
		//Add buttons for creating for zoom breakoutroom csv - clickevent=createCSV
		function getGroupsetID(element){
				//recursive check of parent element until tab-panel and return the groupsetid-part of the tab-panels id
				return element.classList.contains('tab-panel') ? element.id.substring(4) : getGroupsetID(element.parentElement);
		}
		let buttongroups = document.querySelectorAll('div.group-category-actions');
		if (buttongroups != null){
				for (let i=0; i<buttongroups.length; i++){
						if (buttongroups[i].querySelector('button.zoombreakout') == null){
								//groupset without zoombreakout-button
								let groupsetID = getGroupsetID(buttongroups[i]);
								let btn = document.createElement('BUTTON');
								buttongroups[i].insertBefore(btn,buttongroups[i].firstChild);
								btn.outerHTML = `<button id="zb${groupsetID}" class="btn zoombreakout" value="${groupsetID}" role="button" title="Zoom Breakout room csv" aria-label="Zoom Breakout room csv"><i class="icon-export-content"></i> Zoom Breakout room csv</button>`;
								document.getElementById(`zb${groupsetID}`).addEventListener('click',uiaZBcreateCSV);
						}
				}
		}
}

const uiaZBconfig = { attributes: false, childList: true, subtree: true };
const uiaZBobserver = new MutationObserver(uiaZBaddButtons);
uiaZBobserver.observe(document.getElementById('content'), uiaZBconfig);
uiaZBaddButtons();