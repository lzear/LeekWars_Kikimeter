// ==UserScript==
// @name       		LeekWars : LeeKikiMeter
// @description  	Ce script affiche un résumé des combats de leekwars
// @match      		http://leekwars.com/report/*
// @author			Elzéar
// @grant			none
// ==/UserScript==


// URL DE LA PAGE PHP QUI RECEPTIONNE LES DONNEES
var dataReceiverURL = ''; // http:// TRUC /get.php

// EDITER dispData POUR CHOISIR LES COLONNES À AFFICHER
var dispData = ['level', 'turnsPlayed', 'dmg_out', 'dmg_in', 'heal_out', 'heal_in', 'PT', 'PM', 'fails', 'lastHits', 'blabla', 'crashes'];
//var dispData = ['fightId','leekId','name','level','XP','draw','team','alive','gainXP','gainTalent','gainHabs','turnsPlayed','PT','PM',	'actionsWeapon',	'actionsChip','dmg_in','dmg_out','heal_in','heal_out','fails','lastHits','blabla','crashes']; // <--- Toutes les données


'fightId','leekId','name','level','XP','draw','team','alive','gainXP','gainTalent','gainHabs','turnsPlayed','PT','PM',	'actionsWeapon',	'actionsChip','dmg_in','dmg_out','heal_in','heal_out','fails','lastHits','blabla','crashes'

// intitulés des variables
var kikimeterData = {
    'fightId' : 'Fight ID',
    'leekId' :	'Leek ID',
    'name':		'Nom',
    'level' :	'Niveau',
    'XP' :		'XP',
    'draw' :	'Match Nul',
    'team' :	'Équipe',
    'alive' :	'Vivant',
    'gainXP' :	'Gain XP',
    'gainTalent':'Gain Talent',
    'gainHabs' :'Gain Habs',
    'turnsPlayed':'Tours joués',
    'PT' :	'PT',
    'PM' :	'PM',
	'actionsWeapon' : 'Tirs',
	'actionsChip' : 'Usages Chips',
    'dmg_in' :	'Dégats reçus',
    'dmg_out' :	'Dégats infligés',
    'heal_in' :	'Soins reçus',
    'heal_out' :'Soins lancés',
    'fails' :	'Échecs',
    'lastHits' :'Kills',
    'blabla' :	'Blabla',
    'crashes' : 'Plantages'
} ;

// OBJET LEEK
function Leek(leekId, name, level, XP, team, alive, gainXP, gainTalent, gainHabs) {
    
    this.data = {} ;
    
    for (var key in kikimeterData) {
        this.data[key] = 0 ;
    }
    var urlTab =  document.URL.split('/');
    this.data['fightId'] = parseInt(urlTab[urlTab.length-1]) ;
    this.data['draw'] = (document.getElementsByTagName('h3')[0].textContent == 'Équipe 1') ? 1 : 0 ;
    this.data['leekId'] = leekId ;
    this.data['name'] = name ;
    this.data['level'] = level ;
    this.data['XP'] = XP ;
    this.data['team'] = team ;
    this.data['alive'] = alive ;
    this.data['gainXP'] = gainXP ;
    this.data['gainTalent'] = gainTalent ;
    this.data['gainHabs'] = gainHabs ;
    
    this.addToData = function(dataName, value) {
        this.data[dataName] += value ;
    } ;
}

// Lit les tableaux d'équipes
function readTables()
{
    var report_tables = document.getElementById('report-general').getElementsByTagName('table') ; 
    var a = true ;
    var team = 0 ;
    for (var i = 0; i < report_tables.length; i++) {
        
        if((i+report_tables.length != 4) && (i+report_tables.length != 6))
        {
            team++ ;
            var color = team ? '<div style="background-color:#A0A0EC;">' : '<div style="background-color:#ECA0A0;">' ;
            var trs = report_tables[i].children[0].children ;
            
            for (var j = 1; j < trs.length; j++) {
                if (trs[j].className != 'total')
                {
                    var linkTab = trs[j].getElementsByTagName("a")[0].href.split('/');
                    var leekId = parseInt(linkTab[linkTab.length-1]) ;
                    //var output = color + trs[j].children[0].innerHTML + '</div>' ;
                    var name		= trs[j].children[0].textContent ;
                    var alive		=(trs[j].children[0].children[0].className == 'alive') ? 1 : 0 ;
                    var level		= parseInt(trs[j].children[1].textContent.replace(/[^\d.]/g, '')) ;
					var gainXP		= parseInt(trs[j].children[2].children[1].textContent.replace(/[^\d.]/g, '')) ;
                    var gainTalent	= parseInt(trs[j].children[3].textContent.replace(/[^\d.]/g, '')) ;
                    var gainHabs	= parseInt(trs[j].children[4].textContent.replace(/[^\d.]/g, '')) ;
                    var XP = parseInt(document.getElementById('tt_'+trs[j].children[2].children[0].id).textContent.split('/')[0].replace(/[^\d.]/g, ''));
                    
                    leeks[trs[j].children[0].textContent] = new Leek(leekId, name, level, XP, team, alive, gainXP, gainTalent, gainHabs) ;
                    a = false ;
                }
            }
        }
    }
}

// Lit la liste des actions
function readActions()
{
    var actions = document.getElementById('actions').children;
    
    for(var i=0; i<actions.length; i++) {
        
        // VARIABLES UTILES POUR LES ACTIONS DE PLUSIEURS LIGNES
        if (/^([^\s]+) tire$/.test(actions[i].textContent)) {
            var attacker = RegExp.$1 ;
            var attackerWeapon = RegExp.$1 ;
			leeks[attacker].addToData('actionsWeapon', 1) ;
        }
        if (/^([^\s]+) lance [^\s]+$/.test(actions[i].textContent)) {
            var attacker = RegExp.$1 ;
            var attackerChip = RegExp.$1 ;
			leeks[attacker].addToData('actionsChip', 1) ;
        }
        
        // TOUR
        if (/^Tour de ([^\s]+)$/.test(actions[i].textContent)) {
            leeks[RegExp.$1].addToData('turnsPlayed', 1) ;
        }
        
        // PT
        if (/^([^\s]+) perd ([0-9]+) PT$/.test(actions[i].textContent)) {
            leeks[RegExp.$1].addToData('PT', parseInt(RegExp.$2)) ;
        }
        
        // PM
        if (/^([^\s]+) perd ([0-9]+) PM$/.test(actions[i].textContent)) {
            leeks[RegExp.$1].addToData('PM', parseInt(RegExp.$2)) ;
        }
        
        // DEGATS
        if (/^([^\s]+) perd ([0-9]+) PV$/.test(actions[i].textContent)) {
            leeks[RegExp.$1].addToData('dmg_in', parseInt(RegExp.$2.replace(/[^\d.]/g, ''))) ;
            leeks[attacker].addToData('dmg_out', parseInt(RegExp.$2.replace(/[^\d.]/g, ''))) ;
        }
        
        // SOINS
        if (/^([^\s]+) gagne ([0-9]+) PV$/.test(actions[i].textContent)) {
            leeks[RegExp.$1].addToData('heal_in', parseInt(RegExp.$2.replace(/[^\d.]/g, ''))) ;
            leeks[attackerChip].addToData('heal_out', parseInt(RegExp.$2.replace(/[^\d.]/g, ''))) ;
        }
        
        // ECHEC
        if (/^([^\s]+) tire... Échec !$/.test(actions[i].textContent)) {
            leeks[RegExp.$1].addToData('fails', 1) ;
			leeks[RegExp.$1].addToData('actionsWeapon', 1) ;
        }
        if (/^([^\s]+) lance [^\s]+... Échec !$/.test(actions[i].textContent)) {
            leeks[RegExp.$1].addToData('fails', 1) ;
			leeks[RegExp.$1].addToData('actionsChip', 1) ;
        }
        
        // MORT
        if (/^([^\s]+) est mort !/.test(actions[i].textContent)) {
            leeks[attacker].addToData('lastHits', 1) ;
        }
        
        // BLABLA
        if (/^([^\s]+) dit : /.test(actions[i].textContent)) {
            leeks[RegExp.$1].addToData('blabla', 1) ;
        }
        
        // PLANTAGE
        if (/^([^\s]+) a planté !$/.test(actions[i].textContent)) {
            leeks[RegExp.$1].addToData('crashes', 1) ;
        }
    }
}

// Affiche le tableau de résumé
function displayKikimeter()
{
    var table = document.createElement('table');
    table.className = 'report' ;
    
    var tbody = document.createElement('tbody');
    
    var tr = document.createElement('tr');
    
    var th = document.createElement('th');
    th.appendChild(document.createTextNode('Poireau'));
    tr.appendChild(th) ;
    
    for (var i = 0; i < dispData.length; i++) {
        var th = document.createElement('th');
        th.appendChild(document.createTextNode(kikimeterData[dispData[i]]));
        tr.appendChild(th) ;
    }
    
    tbody.appendChild(tr) ;
    
    for (var j in leeks) {
        tr = document.createElement('tr');
        
        td = document.createElement('td');
        td.style['background-color'] =  (leeks[j].data['team'] == 1) ? '#A0A0EC' : '#ECA0A0' ;
        
        if (leeks[j].data['alive']) {
            var span = document.createElement('span');
            span.className = 'alive' ;
        }
        else {
            var span = document.createElement('span');
            span.className = 'dead' ;
            td.appendChild(span) ;
            span = document.createElement('span') ;
        }
        
        var a = document.createElement('a') ;
        a.href = '/leek/' + leeks[j].data['leekId'] ;
        a.appendChild(document.createTextNode(leeks[j].data['name'])) ;
        span.appendChild(a);
        td.appendChild(span) ;
        
        tr.appendChild(td) ;
        
        for (var i in dispData)	{
            
            td = document.createElement('td');
            td.appendChild(document.createTextNode(leeks[j].data[dispData[i]]));
            tr.appendChild(td) ;
        }
        
        tbody.appendChild(tr) ;
    }
    
    table.appendChild(tbody) ;
    
    var resume = document.createElement('div');
    resume.id = 'report-resume' ;
    
    var h1 = document.createElement('h1');
    h1.appendChild(document.createTextNode('Résumé'));
    document.body.appendChild(h1);
    resume.appendChild(h1);
    resume.appendChild(table);
    
    var page=document.getElementById('page');
    page.insertBefore(resume, page.children[3]);
}

// Truc AJAX pour envoyer les données à la page PHP
function getXMLHttpRequest() {
    var xhr = null;
    
    if (window.XMLHttpRequest || window.ActiveXObject) {
        if (window.ActiveXObject) {
            try {
                xhr = new ActiveXObject("Msxml2.XMLHTTP");
            } catch(e) {
                xhr = new ActiveXObject("Microsoft.XMLHTTP");
            }
        } else {
            xhr = new XMLHttpRequest(); 
        }
    } else {
        alert("Votre navigateur ne supporte pas l'objet XMLHTTPRequest...");
        return null;
    }
    
    return xhr;
}

//		LISTE DES POIREAUX
var leeks = {} ;

//		LECTURE DES TABLEAUX
readTables() ;

//		LECTURE DES ACTIONS
readActions() ;

//		CREATION DU RESUME
displayKikimeter() ;

//		ENVOI DES DONNEES SUR UNE PAGE DISTANTE
if (dataReceiverURL != '')
{
    var json = 'json=' + JSON.stringify( leeks );	// mise au format JSON
    console.log(json) ;
    
    $.ajax({
        type : 'POST',
        url : dataReceiverURL,
        dataType : 'json', 
        data: json,
        success: function(succss){
            console.log(json);
        }
    });
}