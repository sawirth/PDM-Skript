// ==UserScript==
// @name        PDM Private Script
// @description Diverse kleinere Helper für ERP und Shop. For PDMs only! Don't tell anybody about it ;)
// @include		*galaxus*
// @include		*digitec*
// @version     3.01.01
// @grant       GM_xmlhttpRequest
// @grant       GM_setClipboard
// @author		Sandro Wirth
// @icon		http://4.bp.blogspot.com/-tQT0JUaLNJI/TlRLIK2Lh2I/AAAAAAAAABI/Hl1tMwwF7-Y/s1600/aperture+logo+copy.png
// @downloadURL	http://srv-pde01.intranet.digitec/script/sawi/PDM_Skript.user.js
// @updateURL	http://srv-pde01.intranet.digitec/script/sawi/PDM_Skript.user.js
// @require     http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @require     https://code.jquery.com/ui/1.11.4/jquery-ui.min.js
// ==/UserScript==

// --- CHANGELOG -- //
/*
 * 3.1.01: Bufixing
 *
 * 3.1.0: Systemtask Link für Variantenschöpfer
 *
 * 3.0.0: Ctrl + Space klickt auf "Hinzufügen", Ausbau Pflichtquote-Tool, SystemTask-Links
 *
 * 2.9.2: Bugfix
 *
 * 2.9.1: Fix Link wegen neuer Domain im Test-System
 *
 * 2.9.0: Link Live ERP <-> Test ERP hinzugefügt
 *
 * 2.8.0: Automatische Einträge bei Frachtkostenmodell und Produktgebühren (Lieferant)
 *
 * 2.7.0: Mit ESC aktuell offenen Table Eintrag abbrechen
 *
 * 2.6.0: Link von Lieferant zu Produktsuche sowie Beta-Version Pflichtquote-Tool
 *
 * 2.5.0: Mit Enter immer Tabelleneintrag speichern
 *
 * 2.4.1: Various Fixes and Improvements
 *
 * 2.4.0: Verbesserung Datenquellen Helper
 *
 * 2.3.2: Bugfix DbContent löschen und Stichwort Addon
 *
 * 2.3.1: Bugfix Settings
 *
 * 2.3.0: Einbau Datenquelle Helper von Aron
 *
 * 2.2.0: Ausbau Quicklinks in separates Skript
 *
 * 2.1.1: Bugfix das Optionen an falschen Stellen angezeigt wird
 *	
 * 2.1.0: Settings Menü & Bugfix
 *
 * 2.0.1: Bugfix Link Supplier/Configuration
 *
 * 2.0.0: Integration Stichworte Addon
 *
 * 1.9.0: Hilfsfunktion bei Upgrade auf Lieferant
 *
 * 1.8.1: Fix fehlende Qucklinks, falls in Link Product statt product steht
 * 1.8.0: Beschreibung, Link und Abkürzung bei PG, PED und PDO mit einem Klick löschen
 
 * 1.7.0: Auto-Insert gleiche Zeit bei Bestellzeitpunkt
 
 * 1.6.1: Fix automatisches Edit bei PropertyContextProperty
 *
 */

var erpURL = "https://erp.galaxus.ch";
var testErpUrl = "https://test-erp.digitecgalaxus.ch";
var shopURL = "https://www.galaxus.ch/";
var testShopUrl = "https://test-www.digitecgalaxus.ch";
var erpUrlWithLang = erpURL + "/de/";
var erpBaseUrls = {
	"Order": erpUrlWithLang + "Order/",
	"Property": erpUrlWithLang + "Property/"
};

var erpUrlPart = {
	"SupplierConfig": "Customer/Configuration/"
};

var currentURL = window.location.href.toLowerCase();
var currentBaseUrl = window.location.href.split("/");
currentBaseUrl = currentBaseUrl[0] + "//" + currentBaseUrl[1] + currentBaseUrl[2] + "/de/";

var pathname = window.location.pathname;


$(document).ready(function() {

	/****************************************
	 *			Shop Features				*
	 ****************************************/
	if (isInShop()) {

		//Direktlink von Bestellung ins ERP
		if (currentURL.indexOf("order") > -1) {
			$("#content-area .row").first().find("h1").wrap("<a href=" + erpBaseUrls["Order"] + window.location.pathname.split("/")[3] + "></a>");
		}

		//Funktionen in der Produktansicht
		if (currentURL.indexOf("/product/") > -1) {

			//Verlinkt von der Eigenschaft auf die Property
			$("div[data-type='4']").each(function() {
				$(this).wrap('<a href="' + erpBaseUrls["Property"] + $(this).attr("data-propertyid") + '"></a>');
			});
		}
	}


	/****************************************
	 *			ERP Features				*
	 ****************************************/
	if (isInERP()) {
		var userId = getUserId();
		createSettingsDialog();


		//Link für Switch Test ERP <-> Live ERP
		if (currentBaseUrl.indexOf("test-erp.") > -1) {
			$("#userinfo").append('<div class="cell"><div class="value"><a href="' + erpURL + pathname + '">Live ERP</a></div></div>');
		} else {
			$("#userinfo").append('<div class="cell"><div class="value"><a href="' + testErpUrl + pathname + '">Test ERP</a></div></div>');
		}

		//Gelbe Dialog-Box mit Enter(13) bestätigen (= Ja klicken)
		if (detectYellowUiDialog) {
			$(document).keypress(function(e) {
				if (e.which == 13) {
					$('.ui-dialog:visible').find("button:contains('Ja')").click();
				}
			});
		}


		//Speichert den zuletzt geklickten "Hinzufügen" Button. Als Default wird beim Page load der erste Button gespeichert
		var addTableRowButton = $('a[onclick="$(this).newErpTableRow(); return false;"]').first();
		$('a[onclick="$(this).newErpTableRow(); return false;"]').click(function(eventObject) {
			addTableRowButton = $(this);
		});


		//Key Shortcuts im ERP
		$(document).keyup(function(e) {
			if (e.keyCode == 13) $(".edit.add").find(".icon.save").click();			//Mit Enter Table Eintrag speichern
			if (e.keyCode == 27) $(".edit.add").find(".icon.cancel").click();		//Mit ESC Table Eintrag abbrechen
			if (e.keyCode == 32 && e.ctrlKey) addTableRowButton.click();			//CTRL + Space clicks on "Hinzufügen"
		});

		//ProductCreator Features
		if (currentURL.indexOf("/productcreator") > -1) {
			$("#controller").css("background-color", "#1b8b71"); //Controller Farbe ändern
		}

		//Brand Features
		if (currentURL.indexOf("brand") > -1) {

			//Row um diverse Cells mmit Links anzuhängen (geschieht über class 'BonusFeatures')
			$("#Brand1").find(".erpBoxContent .column").append(
				'<div class="row BonusFeatures"><div class="cell index" style="width:262px;"><b>Bonus Features</b></div>' +
				'<div class="cell Links" style="width:562;">');
			$(".BonusFeatures").css("background-color", "#CEF6EC").css("border", "1px solid black"); //CSS Styling

			//Link zur Marke im Shop
			var brandId = currentURL.split("/")[currentURL.split("/").length - 1];
			$(".Links").append('<div class="cell " style="width:100px;"><a class="BrandLink" href="' + shopURL + "Brand/" + brandId + '">Marke im Shop</a></div></div></div>');

			//Link in die erweiterte Suche mit Marke vorausgewählt
			var advSearchUrl = currentBaseUrl + 'Product/AdvancedSearch?BrandId.rendered=&BrandId=' + brandId +
				'&BrandId_No=1&ProductAdvancedSearchViewData.SelectedProperty=-1&SearchResultFieldViewData.SortingFieldName=TurnoverT28&SearchResultFieldViewData.' +
				'SortingDirection=1&ProductAdvancedSearchViewData.ViewId=ListWithoutProductImages&ProductAdvancedSearchViewData.PageSize=100&ProductAdvancedSearchViewData.NumberOfResults=-1&Search=Suche#r';
			$(".Links").append('<div class="cell" style="width:100px;"><a href="' + advSearchUrl + '">Erweiterte Suche</a></div>');
		}

		//Öffnet in der Eigenschaftenansicht des Produktesdirekt den Bearbeitungsmodus
		if (currentURL.indexOf("productproperties") > -1) {

			if (localStorage.enablePCAutoEdit === "1") {
				$(".precede.edit").first().click();
			}

			$(".precede.edit").first().click(function() {
				setTimeout(function() {
					showPflichtQuote();
				}, 1500);
			});
		}

		//Produktdatenquelle Features
		if (currentURL.indexOf("datasourceproduct") > -1 && localStorage.enableDataSourceFunctions === "1") {

			//Verlinkt direkt auf Lieferant/Konfiguration
			try {
				var supplierId = grabProduktIdFromUrl($("#DataSourceProductBox1").find("a[href*='Customer']").attr("href"));
			} catch(e) {
				// console.log(e);
			}
			
			$("#DataSourceProductBox1").find("a[href*='Customer']").attr("href", currentBaseUrl + erpUrlPart["SupplierConfig"] + supplierId);

			//Datasource Helper by Aron
			$("#DataSourceProduct_DataSource_Password").parent().after('<br><button type="button" id="addon_pw">Add Random PW + Copy</button>');
			$('#addon_pw').click(function(){
			    getPW().then(function(value) {
			        $('#DataSourceProduct_DataSource_Password').val(value);
			        GM_setClipboard(value);
			    });
			});

			function getPW() {
			    return new Promise(function(resolve, request) {
			        GM_xmlhttpRequest({
			            method: "GET",
			            url: "https://identitysafe.norton.com/password?&include_phonetic=false&include_numbers=true&include_letters=true&include_mixedcase=true&include_punctuation=false&no_similar=true&num_passwords=1&password_length=10",
			            onload: function(response) {
			                resolve(JSON.parse(response.responseText).passwords[0].value);
			            }
			        });
			    });
			}

			//Set default values
			$("#DataSourceProduct_PriceCheckFraction").val(0.3);
			$("#DataSourceProduct_PriceIgnoreFraction").val(0.7);
			$("#DataSourceProduct_PreventDeletionFraction").val(0.2);
			$("#DataSourceProduct_PriceFactor").val(1);
			$("#DataSourceProduct_DataSource_EncodingCodePage").val(1252);
			$("#DataSourceProduct_DataSource_CsvQuoteCharacter").val('"');
			$("#DataSourceProduct_DataSource_CsvSeparator").val(";");
			$("#DataSourceProduct_DataSource_HeaderIndex").val(0);
			$("#DataSourceProduct_DataSource_DaysUntilFileDateOutdated").val(365);
			$("#DataSourceProduct_EmployeeId").val(userId);

		}

		//PropertyContext Features
		if (currentURL.indexOf("propertycontext/") > -1 && localStorage.enablePCAutoEdit === "1") {

			//Öffnet direkt den Bearbeitungsmodus
			$(".precede.edit").click();
		}

		//Customer Features
		if (currentURL.indexOf("customer/") > -1 && localStorage.enableSupplierFunctions === "1") {

			//Customer/Supplier Features
			if (currentURL.indexOf("supplier/") > -1) {

				//Setzt Bestellzeitpunkt beim hinzufügen gleich dem bisherigen Wert oder per Default auf 10:00
				$("#SupplierOrderingTime6 .precede.add").click(function() {
					setTimeout(function() {
						var time = $("#SupplierOrderingTime6 .tablesorter tbody td").first().text();
						if (time != "") {
							$("#SupplierOrderingTime_Time").attr("value", time);
						} else {
							//10:00:00 statt 00:00:00 als Default Wert, wenn zuvor kein Wert definiert ist
							$("#SupplierOrderingTime_Time").attr("value", "10:00:00");
						}
					}, 750);
				});

				//Setzt beim Frachtkostenmodell den Tag automatisch auf heute
				$("a[href*='FreightChargesModel']").click(function() {
					//TODO: Statt timeout direkt einen ajax-call machen und beim success Datum einfügen
					setTimeout(function() {
						$("#FreightChargesModel_ItemProfitFreightChargesExpenseValidFrom").val(getDateToday());
					}, 750);
				});

				//Setzt beim Hinzufügen von Produktgebühren den Tag auf Anfang Jahr
				$("a[href*='SupplierProductFeeHandling']").click(function() {
					setTimeout(function() {
						$("#SupplierProductFeeHandling_ValidFrom").val(getDateFirstDayOfYear());
						$("#SupplierProductFeeHandling_ProductFeeHandlingId").val(4);
					}, 600);
				});
			}

			//Link von Lieferant auf erweiterte Produktsuche
			if ($(".tabs.wrap").find("a[href*='Supplier']").length > 0) {
				var customerId = currentURL.split("/")[currentURL.split("/").length - 1].replace("#t", "");
				var supplierProductSearchUrl = currentBaseUrl + "Product/AdvancedSearch?SupplierId=" + customerId + "&SupplierId_No=1&ProductAdvancedSearchViewData.SelectedProperty=-1" +
					"&SearchResultFieldViewData.SortingFieldName=TurnoverT28&SearchResultFieldViewData.SortingDirection=1&ProductAdvancedSearchViewData.ViewId=ListWithoutProductImages" +
					"&ProductAdvancedSearchViewData.PageSize=500&pageIndex=1&Search=Suche#r";

				$("#viewmenu ul li:nth-child(2)").first().find("ul").append('<li><table><tbody><tr><td class="menu_link"><a href="' + supplierProductSearchUrl + '">Produkte</a></td></tr></tbody></table></li>');
			}
		}

		//Hilfsfunktionen bei Upgrade auf Lieferant
		if (currentURL.indexOf("supplier/fromcompanynew") > -1 && localStorage.enableSupplierFunctions === "1") {
			//Dropdowns Default (ausser Stromstecker)
			$("#Supplier_CancelRequestSettingId").val("1");
			$("#Supplier_DelayedDeliveryDateSettingId").val("1");
			$("#Supplier_DeliveryDateRequestSettingId").val("1");

			//Land = Schweiz
			$("#SupplierDeliveryInformation_CountryId").val("1");

			//Spätester Bestellzeitpunkt Buttons für Slot 1 oder 2
		}

		//DbContent bei PG, PED und PDO mit einem Klick löschen
		if ((currentURL.indexOf("propertydefinition") > -1 || currentURL.indexOf("/propertygroup/") > -1 || currentURL.indexOf("/producttype/") > -1) && localStorage.enableDBC_delete === "1") {
			//Buttons hinzufügen
			if ($("#main_content .menu").length != 0) {
				//falls Menu schon existiert
				$("#main_content .menu").children().append('<li><table><tbody><tr><td class="menu_link"><a class="deleteDbContent" href="#">DbContent löschen</a></td></tr></tbody></table></li>');
			} else {
				//Button inkl. Menu
				$("#main_content").prepend('<div id="viewmenu"><div class="menu"><ul><li><table><tbody><tr><td class="menu_link"><a class="deleteDbContent" href="#">DbContent löschen</a></td>' +
					'</tr></tbody></table></li</ul></div></div>');
			}

			//Funktion bei Klick auf Button
			var deleteContent = $(".deleteDbContent").click(function() {
				var deleteUrl = currentBaseUrl + "DbContent/Delete/";
				var ids = [];

				//Bestätigung erforderlich
				//Ids direkt speichern, falls schon im Edit-Mode
				if ($("a[href*='DbContent']").length != 0) {
					ids = getDbContentIds();
					if (confirm("Wirklich folgende DbContents löschen? Kann nicht rückgängig gemacht werden\n" + getValuesOfDbContent(ids)) == false)
						return;
					deleteDbContent(ids);
				} else {
					//Ansonsten Edit Mode öffnen und dann direkt fortfahren
					$(".precede.edit").click();
					setTimeout(function() {
						ids = getDbContentIds();
						if (ids.length == 0) {
							alert("Kein DbContent vorhanden zum Löschen");
							return;
						}

						if (confirm("Wirklich folgende DbContents löschen? Kann nicht rückgängig gemacht werden\n" + getValuesOfDbContent(ids)) == false)
							return;
						deleteDbContent(ids);
					}, 700);
				}

				function deleteDbContent(ids) {
					for (var i = 0; i < ids.length; i++) {
						$.post(deleteUrl + ids[i], function(data, status) {
							console.log("Status: " + status);
							location.reload();
						});
					}
				}

				function getDbContentIds() {
					var ids = [];
					$("a[href*='DbContent']").each(function() {
						ids.push($(this).attr("href").split("/")[4]);
					});
					ids.shift(); //entfernt den ersten DbContent da dieser der Name ist
					return ids;
				}

				function getValuesOfDbContent(ids) {
					var string = [];
					for (var i = 0; i < ids.length; i++) {
						var text = $("a[href*='" + ids[i] + "']").parent().text();
						string.push("Wert: " + text.substring(0, text.length - 1) + " -- Id: " + ids[i] + "\n");
					}
					return string.join("");
				}
			});
		}

		//Produkttyp Funktionen
		if (currentURL.indexOf("/producttype/") > -1) {

			/*---- Stichworte Addon by Aaron ----*/
			var id = grabProduktIdFromUrl(window.location.href);
			var languages = ["Bitte wählen", "Deutsch", "Englisch", "Französisch", "Italienisch", "Spanisch", "Albanisch", "Portugiesisch", "Arabisch", "Dänisch", "Griechisch", "Kroatisch", "Niederländisch", "Panjabi", "Polnisch"];

			//HTML Element einfügen
			$("#ProductTypeKeyword4 .box-title, #ProductTypeKeyword3 .box-title").append('<div><ul><li><input id = "StichworteAddon" type=text placeholder = "Stichwörter hier einfügen"' +
				' style ="width: 200px;padding: 0px; margin:5px;line-height: 16px; !important"><td class="icons"><input class="icon save stichwort addon" type="submit" value=" " ' +
				'name="save"  style="line-height: 16px; !important"></td></li></ul></div><br>');

			//Funktion zum Hinzufügen
			$('.icon.save.stichwort.addon').click(function() {
				var v = $("#StichworteAddon").val().split("\t\t")[0].split("\t");
				var sprache = $.inArray(v[0], languages);
				v.splice(0, 1);
				if (v.length <= 0)  {
					alert("Keine Stichwörter eingetragen");
					return;
				}

				if (confirm("Produkttyp: " + id + "\nSprache: " + languages[sprache] + "\n\n" + "Dies wird folgende Stichwörter hinzufügen:\n\n" + v.join(", "))) {
					for (var i = 0; i < v.length; i++) {
						if (v[i] != "")
							postUrl(id, sprache, v[i]);
					}

					$("#StichworteAddon").attr("value", "");
				}
			});
		}

		if (currentURL.indexOf("/systemtask/") > -1){
			addSystemTaskLinks();
		}

		if (currentURL.indexOf("/productvariantautomaticconfiguration") > -1) {
			//Link zum Systemtask des Variantenschöpfers
			$("#controllermenu .menu ul").append('<li><table><tbody><tr><td class="menu_link"><a href="SystemTask/1497" tabindex="-1">Systemtask</a></td></tr></tbody></table></li>');
		}
	}
});


/****************************************
 *			 Helper functions 			*
 ****************************************/

function getUserId() {
	var href = $('a[href*="/Person/"]').prop("href").split("/");
	var id = href[href.length - 1];
	return id;
}

//Gibt true zurück, falls ein gelber ERP-Dialog sichtbar ist
function detectYellowUiDialog() {
	return $('.ui-dialog:visible').length > 0;
}

//Gibt true zurück, falls sich der User im Live oder Test Shop befindet (digitec und Galaxus)
function isInShop() {
	return currentURL.indexOf("www.galaxus") > -1 || currentURL.indexOf("galaxus-shop") > -1 || currentURL.indexOf("www.digitec") > -1 || currentURL.indexOf("digitec-shop") > -1;
}

//Gibt true zurück falls sich der User im Live oder Test ERP befindet
function isInERP() {
	return currentURL.indexOf("erp") > -1;
}


//Erstellt den HTML Code für den Settings Dialog
function createSettingsDialog() {

	//Dialog Elemente erstellen
	$("body").append("<div id='dialog' title='Optionen'><ul class='settingsList'></ul></div>");
	$(".settingsList").hide();

	//Link in User-Dropdown einfügen
	$("a[href*='Logout']").closest("li").after('<li><table><tbody><tr><td class="menu_link"><a href="#" class="scriptSettings" tabindex="-1">Skript Optionen</a></td><td class="menu_shortcut">&nbsp;</td></tr></tbody></table></li>');

	//addCheckboxToSettings("Quicklinks", "showQuickLinks");
	addCheckboxToSettings("Datenquelle Funktionen", "dataSourceFunctions");
	addCheckboxToSettings("Auto Edit", "autoEditPC");
	addCheckboxToSettings("Lieferant Funktionen", "supplierFunctions");
	addCheckboxToSettings("DbContent Löschen", "deleteDBC");
	initSettings();

	//Zeigt den Dialog an
	$(".scriptSettings").click(function(e) {
		e.preventDefault();
		$(".settingsList").show();
		$("#dialog").dialog({
			buttons: {
				"Speichern": function() {
					saveAllSettings();
					$(this).dialog("close");
				},
				"Abbrechen": function() {
					$(this).dialog("close");
				}
			}
		});
	});

	function addCheckboxToSettings(text, klasse) {
		$(".settingsList").append('<li><input class="settingsCheckBox ' + klasse + '"type="checkbox">' + text + '</input></li>');
	}
}

function initSettings() {

	//Datenquelle Funktionen
	if (localStorage.enableDataSourceFunctions == undefined || localStorage.enableDataSourceFunctions === "1") {
		localStorage.enableDataSourceFunctions = "1";
		$(".dataSourceFunctions").prop("checked", true);
	} else {
		$(".dataSourceFunctions").prop("checked", false);
	}

	//Auto Edit PropertyContext
	if (localStorage.enablePCAutoEdit == undefined || localStorage.enablePCAutoEdit === "1") {
		localStorage.enablePCAutoEdit = "1";
		$(".autoEditPC").prop("checked", true);
	} else {
		$(".autoEditPC").prop("checked", false);
	}

	//Lieferanten Funktionen
	if (localStorage.enableSupplierFunctions == undefined || localStorage.enableSupplierFunctions === "1") {
		localStorage.enableSupplierFunctions = "1";
		$(".supplierFunctions").prop("checked", true);
	} else {
		$(".supplierFunctions").prop("checked", false);
	}

	//DbContent löschen
	if (localStorage.enableDBC_delete == undefined || localStorage.enableDBC_delete === "0") {
		localStorage.enableDBC_delete = "0";
		$(".deleteDBC").prop("checked", false);
	} else {
		$(".deleteDBC").prop("checked", true);
	}
}

function saveAllSettings() {

	if ($(".dataSourceFunctions").is(":checked")) {
		localStorage.enableDataSourceFunctions = "1";
	} else {
		localStorage.enableDataSourceFunctions = "0";
	}

	if ($(".autoEditPC").is(":checked")) {
		localStorage.enablePCAutoEdit = "1";
	} else {
		localStorage.enablePCAutoEdit = "0";
	}

	if ($(".supplierFunctions").is(":checked")) {
		localStorage.enableSupplierFunctions = "1";
	} else {
		localStorage.enableSupplierFunctions = "0";
	}

	if ($(".deleteDBC").is(":checked")) {
		localStorage.enableDBC_delete = "1";
	} else {
		localStorage.enableDBC_delete = "0";
	}
}



//abgeänderte ERP-Funktion, hinterlegt Response blau
function postUrl(id, lang, val) {
	$.ajax({
		type: "POST",
		url: currentBaseUrl + "/ProductTypeKeyword/New/" + id + "?ajaxerplist=2",
		headers: {
			"Content-type": "application/x-www-form-urlencoded"
		},
		data: 'ProductTypeKeyword.LanguageId=' + lang + '&ProductTypeKeyword.Value=' + val + '&X-Requested-With=XMLHttpRequest',
		success: function(response) {
			//console.log(response);
			var html = unescape(response).split('"html":"')[1].split('","')[0];
			//console.log(html);
			var titleDiv = $("#ProductTypeKeyword4 .box-title, #ProductTypeKeyword3 .box-title");
			var form = titleDiv.next();
			var table = $('table:first', form);
			var titleTr = $('tr:first', table);
			var tr = $('<tr class="edit add"></tr>');
			table.show();
			tr.insertAfter(titleTr);
			tr.html(html);
		}
	});
}

function grabProduktIdFromUrl(url) {
	var g_surl = url.split("/");
	var g_urlId = g_surl[g_surl.length - 1];
	var g_furlId = g_urlId.split("?")[0];
	var g_surlId = g_furlId.split("-");
	var g_currentid = g_surlId[g_surlId.length - 1];
	return g_currentid;
}

function getDateToday() {
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth() + 1;
	var yyyy = today.getFullYear();

	if (dd < 10) {
		dd = '0' + dd;
	}

	if (mm < 10) {
		mm = '0' + mm;
	}

	return getDate(dd, mm, yyyy);
}

function getDateFirstDayOfYear() {
	var today = new Date();
	var year = today.getFullYear();
	return getDate('01', '01', year);
}

function getDate(dd, mm, yyyy) {
	return dd + '.' + mm + '.' + yyyy;
}

function addSystemTaskLinks() {
	var button_pdq = '<li><table><tbody><tr><td class="menu_link"><a id="addon_pdq" class="" tabindex="-1" href="javascript:void(0);">Produktdatenquelle</a></td></tr></tbody></table></li>';
	var button_pc = '<li><table><tbody><tr><td class="menu_link"><a id="addon_pc" class="" tabindex="-1" href="javascript:void(0);">Produktschöpfer</a></td></tr></tbody></table></li>';

	$("#main_content .menu ul").append(button_pdq);
	$("#main_content .menu ul").append(button_pc);

	var selector = 'input[name^="SystemTask.SystemTaskParametersid"]';

	$("#addon_pc").click(function() {
		if($(selector).length != 0) {
			$("#addon_pc").attr("href", currentBaseUrl + "ProductCreator/ProductCreatorProductTypes/" + $(selector).val());
		} else {
			$('a[href^="/de/SystemTask/Edit/"]').click();
		}
	});

	$("#addon_pdq").click(function() {
		if($(selector).length != 0) {
			$("#addon_pdq").attr("href", currentBaseUrl + "DataSourceProduct/" + $(selector).val());
		} else {
			$('a[href^="/de/SystemTask/Edit/"]').click();
		}
	});
}

