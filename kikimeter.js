// ==UserScript==
// @name       		LeekWars : LeeKikiMeter
// @description  	Ce script affiche un résumé des combats de leekwars
// @match      		http://leekwars.com/report/*
// @author			Elzéar, yLark
// @grant			none
// @projectPage		https://github.com/Zear06/LeekWars_Kikimeter
// ==/UserScript==


// URL DE LA PAGE PHP QUI RÉCEPTIONNE LES DONNÉES
var dataReceiverURL = ''; // http://<TRUC>/get.php

// ÉDITER dispData POUR CHOISIR LES COLONNES À AFFICHER
var dispData = [
//	'leekFightId',
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
	'PTperTurn',
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

// Intitulés des variables
var kikimeterData = {
	'leekFightId' : 'Leek Fight ID',
    'fightId' : 'Fight ID',
    'leekId' :	'Leek ID',
	'team' :	'Équipe',
	'color' : 'Couleur',				// Couleur du poireau
	'draw' :	'Match Nul',
    'name':		'Nom',
	'turnsPlayed':'Tours joués',
    'level' :	'Niveau',
    'XP' :		'XP',
    'alive' :	'Vivant',
    'PT' :	'PT',
	'PTperTurn' : 'PT/tour',
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
function Leek(leekFightId, leekId, name, level, XP, team, alive, bonus, gainXP, gainTalent, gainHabs) {
    
    this.data = {} ;
    
    for (var key in kikimeterData) {
        this.data[key] = 0 ;
    }
    var urlTab =  document.URL.split('/');
	this.data['leekFightId'] = leekFightId ;
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
	
    this.addToData = function(dataName, value) {	// Incrémente une valeur
        this.data[dataName] += value ;
    } ;
    
    this.writeData = function(dataName, value) {	// Initialise une valeur
        this.data[dataName] = value ;
    } ;
}
	
function leeksAllData(dataName) {	// Retourne un tableau contenant la propriété dataName de tous les poireaux
	var allData = [];
	for(var leek in leeks){
		allData[leek] = leeks[leek].data[dataName];
	}
	return allData;
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
function getLeekCount() {
    var nb_leeks = 0;
    for(var j in leeks){
        nb_leeks++;
    }
    return nb_leeks;
}

// Retourne le nombre de leeks d'une équipe ayant participé au combat
function getTeamLeekCount(team_number) {
    var nb_leeks = 0;
    for(var j in leeks){
        if(leeks[j].data['team'] == team_number)
            nb_leeks++;
    }
    return nb_leeks;
}

// Lit les tableaux d'équipes
function readTables() {
    var report_tables = document.getElementById('report-general').getElementsByTagName('table') ; 
    var a = true ;
    var team = 0 ;
	var leekFightId = 0 ;	// Numéro unique du poireau dans le cadre de ce combat
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
                    var leekId      = parseInt(linkTab[linkTab.length-1]) ;		// Numéro du poireau dans le jeu
                    var name        = trs[j].getElementsByClassName('name')[0].textContent ;
                    var alive       = (trs[j].getElementsByClassName('name')[0].children[0].className == 'alive') ? 1 : 0 ;
                    var level       = parseInt(trs[j].getElementsByClassName('level')[0].textContent.replace(/[^\d.]/g, '')) ;
                    var gainXP      = parseInt(trs[j].getElementsByClassName('xp')[0].children[1].textContent.replace(/[^\d.]/g, '')) ;
                    var gainTalent  = parseInt(trs[j].getElementsByClassName('talent')[0].textContent.replace(/[^\-?\d.]/g, '')) ;
                    var gainHabs    = parseInt(trs[j].getElementsByClassName('money')[0].children[0].firstChild.textContent.replace(/[^\d.]/g, '')) ;
                    var XP          = parseInt(document.getElementById('tt_'+trs[j].getElementsByClassName('xp')[0].children[0].id).textContent.split('/')[0].replace(/[^\d.]/g, ''));
                    
                    leeks[name] = new Leek(leekFightId, leekId, name, level, XP, team, alive, bonus, gainXP, gainTalent, gainHabs) ;
                    a = false ;
					leekFightId++ ;
                }
            }
        }
    }
}

// Recolorise le nom des leeks dans le rapport général. Reprend la structure et la démarche de la fonction readTables()
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
function readActions() {
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
			leeks[RegExp.$1].writeData('PTperTurn',  leeks[RegExp.$1].data['PT'] / leeks[RegExp.$1].data['turnsPlayed']) ;
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
            leeks[attacker].addToData('heal_out', parseInt(RegExp.$2.replace(/[^\d.]/g, ''))) ;
        }
        
        // ARME ÉQUIPÉE
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
function displayKikimeter() {
    var table = document.createElement('table');
    table.className = 'report' ;
    
	// thead
    var thead = document.createElement('thead');
    
    var tr = document.createElement('tr');
    
    var th = document.createElement('th');
    th.appendChild(document.createTextNode('Poireau'));
    tr.appendChild(th) ;
    
    for (var i in dispData) {
        var th = document.createElement('th');
        th.appendChild(document.createTextNode(kikimeterData[dispData[i]]));
        tr.appendChild(th) ;
    }
    
    thead.appendChild(tr) ;
	table.appendChild(thead) ;
    
	// tbody
	var tbody = document.createElement('tbody');
	
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
            td.appendChild(document.createTextNode(Math.round(leeks[j].data[dispData[i]]*10)/10));
            tr.appendChild(td) ;
        }
        
        tbody.appendChild(tr) ;
    }
	table.appendChild(tbody) ;
    
	// tfoot
    // Affichage des sommes du combat
	var tfoot = document.createElement('tfoot');
	
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
        td.appendChild(document.createTextNode( Math.round(fightSum(dispData[i])*10)/10 ));
        tr.appendChild(td) ;
    }
	
    tfoot.appendChild(tr) ;
	table.appendChild(tfoot) ;
    // Fin affichage des sommes du combat
    
    var resume = document.createElement('div');
    resume.id = 'report-resume' ;
    
	// Création du titre au-dessus du tableau
    var h1 = document.createElement('h1');
    h1.appendChild(document.createTextNode('Résumé'));
    document.body.appendChild(h1);
    resume.appendChild(h1);
    resume.appendChild(table);
    
	// Insertion du tableau dans le DOM
    var page = document.getElementById('page');
	var report_actions = document.getElementById('report-actions');
    page.insertBefore(resume, report_actions);
}

// OBJET HIGHLIGHT (fait marquant, ou trophée)
function Highlight(img, title, description, message) {
    this.img = img ;
    this.title = title ;
    this.description = description ;
    this.message = message ;
}

function getBestLeek(dataName, maxOrMin) {	// Utile uniquement dans le cadre de la fonction generateHighlights()
	var BestLeek = null;
    var draw = false;
	var threshold;
	if(maxOrMin == 'max'){
		threshold = mean(leeksAllData(dataName)) + (0.18*getLeekCount()+0.34) * stdev(leeksAllData(dataName));	// Seuil défini en fonction de la moyenne des valeurs, de l'écart type et du nombre de poireaux impliqués dans le combat
	}else{
		threshold = mean(leeksAllData(dataName)) - (0.18*getLeekCount()+0.34) * stdev(leeksAllData(dataName));
	}
	for (var j in leeks) {
        if(BestLeek != null && leeks[j].data[dataName] == leeks[BestLeek].data[dataName]){
             draw = true;
        }
        if(BestLeek == null || (leeks[j].data[dataName] > leeks[BestLeek].data[dataName] && maxOrMin == 'max')
							|| (leeks[j].data[dataName] < leeks[BestLeek].data[dataName] && maxOrMin == 'min') ){
            BestLeek = j;
            draw = false;
        }
    }
	if(draw == true || (leeks[BestLeek].data[dataName] < threshold && maxOrMin == 'max')		// S'il y a égalité avec un autre poireau, ou si la valeur ne dépasse pas un certain seuil remarquable, le highlight ne sera pas affiché
					|| (leeks[BestLeek].data[dataName] > threshold && maxOrMin == 'min')
					|| leeks[BestLeek].data[dataName] == 1)	// Si la valeur vaut 1, ça n'est pas suffisamment exceptionnel
		BestLeek = null;
	return BestLeek;
}

// Génère les highlights
function generateHighlights() {
    
    // Tueur
    var BestLeek = getBestLeek('lastHits', 'max');
    if(BestLeek != null){
        Highlights['tueur'] = new Highlight('http://static.leekwars.com/image/trophy/feller.png', 'Tueur', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a tué ' + leeks[BestLeek].data['lastHits'] + ' poireaux', 'Soit ' + Math.round(leeks[BestLeek].data['lastHits'] / fightSum('lastHits') * 100) + ' % des tués');
    }
    
    // Guerrier
    var BestLeek = getBestLeek('dmg_out', 'max');
    if(BestLeek != null){
        Highlights['guerrier'] = new Highlight('http://static.leekwars.com/image/trophy/fighter.png', 'Guerrier', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a infligé ' + leeks[BestLeek].data['dmg_out'] + ' dégâts', 'Soit ' + Math.round(leeks[BestLeek].data['dmg_out'] / fightSum('dmg_out') * 100) + ' % des dégâts');
    }
    
    // Médecin
    var BestLeek = getBestLeek('heal_out', 'max');
    if(BestLeek != null){
        Highlights['medecin'] = new Highlight('http://static.leekwars.com/image/trophy/carapace.png', 'Médecin', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a soigné ' + leeks[BestLeek].data['heal_out'] + ' PV', 'Soit ' + Math.round(leeks[BestLeek].data['heal_out'] / fightSum('heal_out') * 100) + ' % des soins');
    }
    
    // Bavard
    var BestLeek = getBestLeek('blabla', 'max');
    if(BestLeek != null && leeks[BestLeek].data['blabla'] > 2){
        Highlights['bavard'] = new Highlight('http://static.leekwars.com/image/trophy/talkative.png', 'Bavard', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a parlé ' + leeks[BestLeek].data['blabla'] + ' fois', 'Soit ' + Math.round(leeks[BestLeek].data['blabla'] / fightSum('blabla') * 100) + ' % de ce qui a été dit');
    }
    
    // Éphémère
    var BestLeek = getBestLeek('turnsPlayed', 'min');
    if(BestLeek != null && leeks[BestLeek].data['turnsPlayed'] / max(leeksAllData('turnsPlayed'))*100 < 50 ){
        Highlights['ephemere'] = new Highlight('http://static.leekwars.com/image/trophy/gardener.png', 'Éphémère', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> n\'a survécu que ' + leeks[BestLeek].data['turnsPlayed'] + ' tours', 'Soit ' + Math.round(leeks[BestLeek].data['turnsPlayed'] / max(leeksAllData('turnsPlayed')) * 100) + ' % du combat');
    }
    
    // Marcheur
    var BestLeek = getBestLeek('PM', 'max');
    if(BestLeek != null){
        Highlights['marcheur'] = new Highlight('http://static.leekwars.com/image/trophy/walker.png', 'Marcheur', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a marché ' + leeks[BestLeek].data['PM'] + ' PM', 'Soit ' + Math.round(leeks[BestLeek].data['PM'] / fightSum('PM') * 100) + ' % des distances parcourues');
    }
    
    // Tireur
    var BestLeek = getBestLeek('actionsWeapon', 'max');
    if(BestLeek != null){
        Highlights['tireur'] = new Highlight('http://static.leekwars.com/image/trophy/equipped.png', 'Tireur', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a tiré ' + leeks[BestLeek].data['actionsWeapon'] + ' fois', 'Soit ' + Math.round(leeks[BestLeek].data['actionsWeapon'] / fightSum('actionsWeapon') * 100) + ' % des tirs');
    }
    
    // Malchanceux
    var BestLeek = getBestLeek('fails', 'max');
    if(BestLeek != null){
        Highlights['malchanceux'] = new Highlight('http://static.leekwars.com/image/trophy/lucky.png', 'Malchanceux', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a subi ' + leeks[BestLeek].data['fails'] + ' échecs', 'Soit ' + Math.round(leeks[BestLeek].data['fails'] / fightSum('fails') * 100) + ' % des échecs');
    }
    
    // Magicien
    var BestLeek = getBestLeek('actionsChip', 'max');
    if(BestLeek != null){
        Highlights['magicien'] = new Highlight('http://static.leekwars.com/image/trophy/wizard.png', 'Magicien', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a utilisé des puces ' + leeks[BestLeek].data['actionsChip'] + ' fois', 'Soit ' + Math.round(leeks[BestLeek].data['actionsChip'] / fightSum('actionsChip') * 100) + ' % des puces');
    }
    
    // Buggé
    var BestLeek = getBestLeek('crashes', 'max');
    if(BestLeek != null){
        Highlights['bugge'] = new Highlight('http://static.leekwars.com/image/trophy/breaker.png', 'Buggé', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a planté ' + leeks[BestLeek].data['crashes'] + ' fois', 'Soit ' + Math.round(leeks[BestLeek].data['crashes'] / fightSum('crashes') * 100) + ' % des plantages');
    }
	
	// Hyperactif
    var BestLeek = getBestLeek('PTperTurn', 'max');
    if(BestLeek != null && getLeekCount() > 2){
        Highlights['hyperactif'] = new Highlight('http://static.leekwars.com/image/trophy/motivated.png', 'Hyperactif', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a un ratio de ' + Math.round(leeks[BestLeek].data['PTperTurn']*10)/10 + ' PT par tour', 'Soit ' + Math.round(leeks[BestLeek].data['PTperTurn'] / mean(leeksAllData('PTperTurn')) * 10)/10 + ' fois plus que la moyenne');
    }
	
	// Glandeur
    var BestLeek = getBestLeek('PTperTurn', 'min');
    if(BestLeek != null && getLeekCount() > 2){
        if(leeks[BestLeek].data['PTperTurn'] != 0) {
			Highlights['glandeur'] = new Highlight('http://static.leekwars.com/image/trophy/literate.png', 'Glandeur', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a un ratio PT par tour de ' + Math.round(leeks[BestLeek].data['PTperTurn']*10)/10 , 'Soit ' + Math.round(mean(leeksAllData('PTperTurn')) / leeks[BestLeek].data['PTperTurn'] * 10)/10 + ' fois moins que la moyenne');
		}else{
			Highlights['glandeur'] = new Highlight('http://static.leekwars.com/image/trophy/literate.png', 'Glandeur', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> a un ratio PT par tour de ' + Math.round(leeks[BestLeek].data['PTperTurn']*10)/10 , null);
		}
	}
    
	// Invincible
    var BestLeek = null;
    var draw = false;
    for (var j in leeks) {
        if(BestLeek != null && leeks[j].data['dmg_in'] == leeks[BestLeek].data['dmg_in']){
            draw = true;
        }
        if(BestLeek == null || leeks[j].data['dmg_in'] > leeks[BestLeek].data['dmg_in']){
            BestLeek = j;
            draw = false;
        }
    }
    if(draw == false && leeks[BestLeek].data['dmg_in'] == 0){
        Highlights['invincible'] = new Highlight('http://static.leekwars.com/image/trophy/unbeaten.png', 'Invincible', '<span style="color:' + leeks[BestLeek].data['color'] + ';">' + leeks[BestLeek].data['name'] + '</span> n\'a reçu aucun dégât', null);
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
    
    generateHighlights();	// Génère les highlights avant des les insérer dans le DOM
    
    if(length(Highlights) > 0){
        var report_highlights = document.createElement('div');
        report_highlights.id = 'report-highlights' ;
		
		// Création du titre
        var h1 = document.createElement('h1');
        h1.appendChild(document.createTextNode('Hauts faits'));
        document.body.appendChild(h1);
        report_highlights.appendChild(h1);

        for (var i in Highlights) {		// Boucle sur tous les highlights
			
            var report_high = document.createElement('div');
            report_high.className = 'notif';
			
            if(Highlights[i].img != null){
                var img = document.createElement('img');
                img.src = Highlights[i].img;
                report_high.appendChild(img);
            }
			
            if(Highlights[i].title != null){
                var title = document.createElement('div');
                title.className = 'turn';
                title.appendChild(document.createTextNode(Highlights[i].title));
                report_high.appendChild(title);
            }
			
            if(Highlights[i].description != null){
                var description = document.createElement('div');
                description.className = 'action';
                description.innerHTML = Highlights[i].description;
                report_high.appendChild(description);
            }
			
            if(Highlights[i].message != null){
                var message = document.createElement('span');
                message.className = 'date';
                message.appendChild(document.createTextNode(Highlights[i].message));
                report_high.appendChild(message);
            }
			
            report_highlights.appendChild(report_high);
        }

		// Insertion dans le DOM
        var page = document.getElementById('page');
		var report_actions = document.getElementById('report-actions');
		page.insertBefore(report_highlights, report_actions);
    }
}

//	Permet de trier les tableaux en appelant le script présenté ici : http://www.kryogenix.org/code/browser/sorttable
function make_tables_sortable() {
    var s = document.createElement('script');
    s.src = 'http://kryogenix.org/code/browser/sorttable/sorttable.js';
    s.onload = function(){
        sorttable.init();
        Array.prototype.slice.call(document.getElementsByTagName('table')).forEach(
           function(t){
              sorttable.makeSortable(t);
           }
        )
    };
    document.getElementsByTagName('head')[0].appendChild(s);
}


// FONCTIONS STATISTIQUES //
// maximum of an array
function max(arr) {
	var max = null;
	for(var i in arr){
		if(arr[i] > max || max == null) max = arr[i];
	}
	return max;
}
// minimum of an array
function min(arr) {
	var min = null;
	for(var i in arr){
		if(arr[i] < min || min == null) min = arr[i];
	}
	return min;
}
// Taille réelle d'un tableau (arr.length n'est pas fiable)
function length(arr){
	var length = 0;
	for(i in arr){
		length++;
	}
	return length;
}
// sum of an array
function sum(arr) {
	var sum = 0;
	for(var i in arr){
		sum += arr[i];
	}
	return sum;
}
// mean value of an array
function mean(arr) {
	return sum(arr) / length(arr);
}
// sum of squared errors of prediction (SSE)
function sumsqerr(arr) {
	var sum = 0;
	var tmp;
	for (var i in arr) {
		tmp = arr[i] - mean(arr);
		sum += tmp * tmp;
	}
	return sum;
}
// variance of an array (for a population, not a sample)
function variance(arr) {
	return sumsqerr(arr) / (length(arr) - 1);
}
// standard deviation of an array
function stdev(arr) {
	return Math.sqrt(variance(arr));
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

//		PERMET DE TRIER LES TABLEAUX EN CLIQUANT SUR L'ENTÊTE
make_tables_sortable();

//		ENVOI DES DONNEES SUR UNE PAGE DISTANTE
if (dataReceiverURL != '')
{
	// suppression des données non attendues en BDD
	for (var j in leeks) {
		delete leeks[j].data['leekFightId'] ;
		delete leeks[j].data['PTperTurn'] ;
		delete leeks[j].data['color'] ;
	}
	
    var json = 'json=' + JSON.stringify( leeks );	// mise au format JSON
	
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
