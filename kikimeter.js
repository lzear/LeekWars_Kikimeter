// ==UserScript==
// @name       		LeekWars : LeeKikiMeter
// @description  	Ce script affiche un résumé des combats de leekwars
// @match      		http://leekwars.com/report/*
// @author			Elzéar, yLark
// @grant			none
// ==/UserScript==


// URL DE LA PAGE PHP QUI RECEPTIONNE LES DONNEES
var dataReceiverURL = ''; // http://<TRUC>/get.php

// ÉDITER dispData POUR CHOISIR LES COLONNES À AFFICHER
//var dispData = ['fightId','leekId','name','level','XP','draw','team','alive','bonus','gainXP','gainTalent','gainHabs','turnsPlayed','PT','PM','equipWeapon','actionsWeapon','actionsChip','dmg_in','dmg_out','heal_in','heal_out','fails','lastHits','blabla','crashes']; // <--- Toutes les données
var dispData = [
//	'fightId',
//	'leekId',
//	'team',
//	'color',
//	'draw',
//	'name',
	'turnsPlayed',
	'level',
//	'XP',
//	'alive',
	'PT',
	'PM',
//	'equipWeapon',
//	'actionsWeapon',
//	'actionsChip',
	'dmg_in',
	'dmg_out',
	'heal_in',
	'heal_out',
	'lastHits',
	'gainXP',
//	'bonus',
	'gainTalent',
	'gainHabs',
	'fails',
	'blabla',
	'crashes'
	];

// intitulés des variables
var kikimeterData = {
    'fightId' : 'Fight ID',
    'leekId' :	'Leek ID',
	'team' :	'Équipe',
	'color' : 'Couleur',
	'draw' :	'Match Nul',
    'name':		'Nom',
	'turnsPlayed':'Tours joués',
    'level' :	'Niveau',
    'XP' :		'XP',
    'alive' :	'Vivant',
    'PT' :	'PT',
    'PM' :	'PM',
    'equipWeapon' : 'Armes équipées',    // Nombre de fois qu'une arme est équipée
    'actionsWeapon' : 'Tirs',            // Nombre de tirs
    'actionsChip' : 'Usages Chips',
    'dmg_in' :	'Dégats reçus',
    'dmg_out' :	'Dégats infligés',
    'heal_in' :	'Soins reçus',
    'heal_out' :'Soins lancés',
	'lastHits' :'Kills',
    'gainXP' :	'Gain XP',
	'bonus' :	'Bonus XP',
    'gainTalent':'Gain Talent',
    'gainHabs' :'Gain Habs',
    'fails' :	'Échecs',
    'blabla' :	'Blabla',
    'crashes' : 'Plantages'
} ;

// OBJET LEEK
function Leek(leekId, name, level, XP, team, alive, bonus, gainXP, gainTalent, gainHabs) {
    
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
    this.data['bonus'] = bonus ;
    this.data['gainXP'] = gainXP ;
    this.data['gainTalent'] = gainTalent ;
    this.data['gainHabs'] = gainHabs ;
    
    this.addToData = function(dataName, value) {
        this.data[dataName] += value ;
    } ;
    
    this.writeData = function(dataName, value) {
        this.data[dataName] = value ;
    } ;
}

// Retourne la somme d'une datas d'une équipe
function teamSum(teamNumber, dataName) {
    
    var dataNameSum = 0;
    
    for (var j in leeks) {
        if(leeks[j].data['team'] == teamNumber) {
            dataNameSum += leeks[j].data[dataName];
        }
    }
    return dataNameSum;
}

// Retourne le total d'une data pour tous les leeks
function fightSum(dataName) {
    
    var dataNameSum = 0;
    
    for (var j in leeks) {
        dataNameSum += leeks[j].data[dataName];
    }
    return dataNameSum;
}

// Retourne le nombre de leeks ayant participé au combat
function getLeekCount(){
    var nb_leeks = 0;
    for(var j in leeks){
        nb_leeks++;
    }
    return nb_leeks;
}

// Retourne le nombre de leeks d'une équipe ayant participé au combat
function getTeamLeekCount(team_number){
    var nb_leeks = 0;
    for(var j in leeks){
        if(leeks[j].data['team'] == team_number)
            nb_leeks++;
    }
    return nb_leeks;
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
                    if (trs[j].getElementsByClassName('xp')[0].getElementsByClassName('bonus').length ==1)
                    {	var bonus = parseInt(trs[j].getElementsByClassName('xp')[0].getElementsByClassName('bonus')[0].textContent.replace(/[^\d.]/g, ''))
                    } else
                    {	var bonus = 0 ;
                    }
                    var linkTab     = trs[j].getElementsByTagName('a')[0].href.split('/');
                    var leekId      = parseInt(linkTab[linkTab.length-1]) ;
                    var name        = trs[j].getElementsByClassName('name')[0].textContent ;
                    var alive       = (trs[j].getElementsByClassName('name')[0].children[0].className == 'alive') ? 1 : 0 ;
                    var level       = parseInt(trs[j].getElementsByClassName('level')[0].textContent.replace(/[^\d.]/g, '')) ;
                    var gainXP      = parseInt(trs[j].getElementsByClassName('xp')[0].children[1].textContent.replace(/[^\d.]/g, '')) ;
                    var gainTalent  = parseInt(trs[j].getElementsByClassName('talent')[0].textContent.replace(/[^\-?\d.]/g, '')) ;
                    var gainHabs    = parseInt(trs[j].getElementsByClassName('money')[0].children[0].firstChild.textContent.replace(/[^\d.]/g, '')) ;
                    var XP          = parseInt(document.getElementById('tt_'+trs[j].getElementsByClassName('xp')[0].children[0].id).textContent.split('/')[0].replace(/[^\d.]/g, ''));
                    
                    leeks[name] = new Leek(leekId, name, level, XP, team, alive, bonus, gainXP, gainTalent, gainHabs) ;
                    a = false ;
                }
            }
        }
    }
}

// Recolorise le nom des leeks dans le rapport général. Reprend la structure et la démarche de readTables()
function colorize_report_general() {
    var report_tables = document.getElementById('report-general').getElementsByTagName('table') ; 
    
    for (var i = 0; i < report_tables.length; i++) {
        
        if( (i + report_tables.length != 4) && (i + report_tables.length != 6) )
        {
            var trs = report_tables[i].children[0].children ;
            
            for (var j = 1; j < trs.length; j++) {
                
                if (trs[j].className != 'total') {
                    var name = trs[j].children[0].textContent ;   // Récupère le nom du poireau

                    if( trs[j].children[0].children[0].className == 'alive' ) {
                        trs[j].children[0].children[0].children[0].style.color = leeks[name].data['color'];   // Applique la couleur du poireau stockée dans la variable leeks[]
                    }
                    if( trs[j].children[0].children[0].className == 'dead' ) {
                        trs[j].children[0].children[1].children[0].style.color = leeks[name].data['color'];   // Applique la couleur du poireau stockée dans la variable leeks[]
                    }
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
            leeks[RegExp.$1].writeData('color', actions[i].children[0].style.color) ;   // Récupère et stock la couleur du poireau
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
        
        // Arme équipée
        if (/^([^\s]+) prend l'arme [^\s]+$/.test(actions[i].textContent)) {
            leeks[RegExp.$1].addToData('equipWeapon', 1) ;
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
    
    for (var i in dispData) {
        var th = document.createElement('th');
        th.appendChild(document.createTextNode(kikimeterData[dispData[i]]));
        tr.appendChild(th) ;
    }
    
    tbody.appendChild(tr) ;
    
    for (var j in leeks) {
        tr = document.createElement('tr');
        
        td = document.createElement('td');
        td.className = 'name' ;
        
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
        a.style.color = leeks[j].data['color'] ;
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
    
    // Affichage des sommes du combat
    tr = document.createElement('tr');
    tr.className = 'total' ;

    td = document.createElement('td');
    td.className = 'name' ;

    var span = document.createElement('span');
    span.className = 'alive' ;

    span.appendChild(document.createTextNode('Total'));
    td.appendChild(span) ;

    tr.appendChild(td) ;

    for (var i in dispData)	{

        td = document.createElement('td');
        td.appendChild(document.createTextNode( fightSum(dispData[i]) ));
        tr.appendChild(td) ;
    }

    tbody.appendChild(tr) ;
    // Fin affichage des sommes du combat
    
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





// OBJET HIGHLIGHT (fait marquant, ou trophée)
function Highlight(img, title, description, message) {
    
    this.data = {} ;
    
    this.data['img'] = img ;
    this.data['title'] = title ;
    this.data['description'] = description ;
    this.data['message'] = message ;
}

// Génère les highlights
function generateHighlights() {
    
    // Tueur
    var BestLeek = null;
    var draw = false;
    for (var j in leeks) {
        if(BestLeek != null && leeks[j].data['lastHits'] == leeks[BestLeek].data['lastHits']){
             draw = true;
        }
        if(BestLeek == null || leeks[j].data['lastHits'] > leeks[BestLeek].data['lastHits']){
            BestLeek = j;
            draw = false;
        }
    }
    if(draw == false && leeks[BestLeek].data['lastHits'] > fightSum('lastHits')*0.4 && fightSum('lastHits') > 1){
        Highlights['tueur'] = new Highlight('http://static.leekwars.com/image/trophy/feller.png', 'Tueur', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a tué ' + leeks[BestLeek].data['lastHits'] + ' poireaux', 'Soit ' + Math.round(leeks[BestLeek].data['lastHits'] / fightSum('lastHits') * 100) + ' % des tués');
    }
    
    // Guerrier
    var BestLeek = null;
    var draw = false;
    for (var j in leeks) {
        if(BestLeek != null && leeks[j].data['dmg_out'] == leeks[BestLeek].data['dmg_out']){
             draw = true;
        }
        if(BestLeek == null || leeks[j].data['dmg_out'] > leeks[BestLeek].data['dmg_out']){
            BestLeek = j;
            draw = false;
        }
    }
    if(draw == false && leeks[BestLeek].data['dmg_out'] > fightSum('dmg_out')*0.3){
        Highlights['guerrier'] = new Highlight('http://static.leekwars.com/image/trophy/fighter.png', 'Guerrier', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a infligé ' + leeks[BestLeek].data['dmg_out'] + ' dégâts', 'Soit ' + Math.round(leeks[BestLeek].data['dmg_out'] / fightSum('dmg_out') * 100) + ' % des dégâts');
    }
    
    // Médecin
    var BestLeek = null;
    var draw = false;
    for (var j in leeks) {
        if(BestLeek != null && leeks[j].data['heal_out'] == leeks[BestLeek].data['heal_out']){
             draw = true;
        }
        if(BestLeek == null || leeks[j].data['heal_out'] > leeks[BestLeek].data['heal_out']){
            BestLeek = j;
            draw = false;
        }
    }
    if(draw == false && leeks[BestLeek].data['heal_out'] > fightSum('heal_out')*0.3){
        Highlights['medecin'] = new Highlight('http://static.leekwars.com/image/trophy/carapace.png', 'Médecin', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a soigné ' + leeks[BestLeek].data['heal_out'] + ' PV', 'Soit ' + Math.round(leeks[BestLeek].data['heal_out'] / fightSum('heal_out') * 100) + ' % des soins');
    }
    
    // Bavard
    var BestLeek = null;
    var draw = false;
    for (var j in leeks) {
        if(BestLeek != null && leeks[j].data['blabla'] == leeks[BestLeek].data['blabla']){
             draw = true;
        }
        if(BestLeek == null || leeks[j].data['blabla'] > leeks[BestLeek].data['blabla']){
            BestLeek = j;
            draw = false;
        }
    }
    if(draw == false && leeks[BestLeek].data['blabla'] > fightSum('blabla')*0.5 && leeks[BestLeek].data['blabla'] > 4){
        Highlights['bavard'] = new Highlight('http://static.leekwars.com/image/trophy/talkative.png', 'Bavard', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a parlé ' + leeks[BestLeek].data['blabla'] + ' fois', 'Soit ' + Math.round(leeks[BestLeek].data['blabla'] / fightSum('blabla') * 100) + ' % de ce qui a été dit');
    }
    
    // Éphémère
    var BestLeek = null;
    var draw = false;
    var maxTurns = 0;
    for (var j in leeks) {
        if(BestLeek != null && leeks[j].data['turnsPlayed'] == leeks[BestLeek].data['turnsPlayed']){
             draw = true;
        }
        if(BestLeek == null || leeks[j].data['turnsPlayed'] < leeks[BestLeek].data['turnsPlayed']){
            BestLeek = j;
            draw = false;
        }
        if(leeks[j].data['turnsPlayed'] > maxTurns){
            maxTurns = leeks[j].data['turnsPlayed'];
        }
    }
    if(draw == false && leeks[BestLeek].data['turnsPlayed'] < maxTurns*0.4){
        Highlights['ephemere'] = new Highlight('http://static.leekwars.com/image/trophy/gardener.png', 'Éphémère', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> n\'a survécu que ' + leeks[BestLeek].data['turnsPlayed'] + ' tours', 'Soit ' + Math.round(leeks[BestLeek].data['turnsPlayed'] / maxTurns * 100) + ' % du combat');
    }
    
    // Marcheur
    var BestLeek = null;
    var draw = false;
    for (var j in leeks) {
        if(BestLeek != null && leeks[j].data['PM'] == leeks[BestLeek].data['PM']){
            draw = true;
        }
        if(BestLeek == null || leeks[j].data['PM'] > leeks[BestLeek].data['PM']){
            BestLeek = j;
            draw = false;
        }
    }
    if(draw == false && leeks[BestLeek].data['PM'] > fightSum('PM')*0.5 && leeks[BestLeek].data['PM'] > 10){
        Highlights['marcheur'] = new Highlight('http://static.leekwars.com/image/trophy/walker.png', 'Marcheur', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a marché ' + leeks[BestLeek].data['PM'] + ' PM', 'Soit ' + Math.round(leeks[BestLeek].data['PM'] / fightSum('PM') * 100) + ' % des distances parcourues');
    }
    
    // Tireur
    var BestLeek = null;
    var draw = false;
    for (var j in leeks) {
        if(BestLeek != null && leeks[j].data['actionsWeapon'] == leeks[BestLeek].data['actionsWeapon']){
            draw = true;
        }
        if(BestLeek == null || leeks[j].data['actionsWeapon'] > leeks[BestLeek].data['actionsWeapon']){
            BestLeek = j;
            draw = false;
        }
    }
    if(draw == false && leeks[BestLeek].data['actionsWeapon'] > fightSum('actionsWeapon')*0.3 && leeks[BestLeek].data['actionsWeapon'] > 3){
        Highlights['tireur'] = new Highlight('http://static.leekwars.com/image/trophy/equipped.png', 'Tireur', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a tiré ' + leeks[BestLeek].data['actionsWeapon'] + ' fois', 'Soit ' + Math.round(leeks[BestLeek].data['actionsWeapon'] / fightSum('actionsWeapon') * 100) + ' % des tirs');
    }
    
    // Malchanceux
    var BestLeek = null;
    var draw = false;
    for (var j in leeks) {
        if(BestLeek != null && leeks[j].data['fails'] == leeks[BestLeek].data['fails']){
            draw = true;
        }
        if(BestLeek == null || leeks[j].data['fails'] > leeks[BestLeek].data['fails']){
            BestLeek = j;
            draw = false;
        }
    }
    if(draw == false && leeks[BestLeek].data['fails'] > fightSum('fails')*0.3 && leeks[BestLeek].data['fails'] > 3){
        Highlights['malchanceux'] = new Highlight('http://static.leekwars.com/image/trophy/lucky.png', 'Malchanceux', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a subi ' + leeks[BestLeek].data['fails'] + ' échecs', 'Soit ' + Math.round(leeks[BestLeek].data['fails'] / fightSum('fails') * 100) + ' % des échecs');
    }
    
    // Magicien
    var BestLeek = null;
    var draw = false;
    for (var j in leeks) {
        if(BestLeek != null && leeks[j].data['actionsChip'] == leeks[BestLeek].data['actionsChip']){
            draw = true;
        }
        if(BestLeek == null || leeks[j].data['actionsChip'] > leeks[BestLeek].data['actionsChip']){
            BestLeek = j;
            draw = false;
        }
    }
    if(draw == false && leeks[BestLeek].data['actionsChip'] > fightSum('actionsChip')*0.3 && leeks[BestLeek].data['actionsChip'] > 3){
        Highlights['magicien'] = new Highlight('http://static.leekwars.com/image/trophy/wizard.png', 'Magicien', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a utilisé des puces ' + leeks[BestLeek].data['actionsChip'] + ' fois', 'Soit ' + Math.round(leeks[BestLeek].data['actionsChip'] / fightSum('actionsChip') * 100) + ' % des puces');
    }
    
    // Buggé
    var BestLeek = null;
    var draw = false;
    for (var j in leeks) {
        if(BestLeek != null && leeks[j].data['crashes'] == leeks[BestLeek].data['crashes']){
            draw = true;
        }
        if(BestLeek == null || leeks[j].data['crashes'] > leeks[BestLeek].data['crashes']){
            BestLeek = j;
            draw = false;
        }
    }
    if(draw == false && leeks[BestLeek].data['crashes'] > fightSum('crashes')*0.5 && leeks[BestLeek].data['crashes'] > 2){
        Highlights['bugge'] = new Highlight('http://static.leekwars.com/image/trophy/breaker.png', 'Buggé', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a planté ' + leeks[BestLeek].data['crashes'] + ' fois', 'Soit ' + Math.round(leeks[BestLeek].data['crashes'] / fightSum('crashes') * 100) + ' % des plantages');
    }
    
    // Survivant
    var BestLeek = null;
    var draw = false;
    for (var j in leeks) {
        if(BestLeek != null && leeks[j].data['alive'] == leeks[BestLeek].data['alive']){
            draw = true;
        }
        if(BestLeek == null || leeks[j].data['alive'] > leeks[BestLeek].data['alive']){
            BestLeek = j;
            draw = false;
        }
    }
    if(draw == false && getLeekCount() > 2 && getTeamLeekCount(leeks[BestLeek].data['team']) > 1 ){
        Highlights['survivant'] = new Highlight('http://static.leekwars.com/image/trophy/winner.png', 'Survivant', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> est  le seul survivant', null);
    }
    
}


// Affiche les highlights
function displayHighlights() {
    
    generateHighlights();
    
    if(Highlights.length != 'undefined'){
        var report_highlights = document.createElement('div');
        report_highlights.id = 'report-highlights' ;

        var h1 = document.createElement('h1');
        h1.appendChild(document.createTextNode('Hauts faits'));
        document.body.appendChild(h1);
        report_highlights.appendChild(h1);

        for (var i in Highlights) {

            var report_high = document.createElement('div');
            report_high.className = 'notif';

            if(Highlights[i].data['img'] != null){
                var img = document.createElement('img');
                img.src = Highlights[i].data['img'];
                report_high.appendChild(img);
            }

            if(Highlights[i].data['title'] != null){
                var title = document.createElement('div');
                title.className = 'turn';
                title.appendChild(document.createTextNode(Highlights[i].data['title']));
                report_high.appendChild(title);
            }

            if(Highlights[i].data['description'] != null){
                var description = document.createElement('div');
                description.className = 'action';
                description.innerHTML = Highlights[i].data['description'];
                report_high.appendChild(description);
            }

            if(Highlights[i].data['message'] != null){
                var message = document.createElement('span');
                message.className = 'date';
                message.appendChild(document.createTextNode(Highlights[i].data['message']));
                report_high.appendChild(message);
            }

            report_highlights.appendChild(report_high);
        }

        var page = document.getElementById('page');
        page.insertBefore(report_highlights, page.children[4]);
    }
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

//		LISTE DES HAUTS FAITS
var Highlights = {} ;

//		AFFICHAGE DES HAUTS FAITS (HIGHLIGHTS)
displayHighlights() ;

//		MISE EN COULEUR DU NOM DES POIREAUX DANS LE RAPPORT GÉNÉRAL
colorize_report_general();

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
