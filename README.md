LeekWars_Kikimeter
==================
Les fichiers de ce Git sont un outil pour les joueurs du jeu [LeekWars](http://leekwars.com/), créé suite à [une suggestion](http://leekwars.com/forum/category-4/topic-1618)


kikimeter.js
------------

Script JavaScript pour TamperMonkey ou GreaseMonkey.
  
  Insère des informations complémentaires dans la page *Rapport de combat* :
  - un résumé des `Error` et `Warning` avec lien cliquable ;
  - un tableau des statistiques du combat ;
  - un graphique d'évolution des PV ;
  - un tableau de synthèse de l'usage des PT ;
  - une série de hauts faits ;
  - un menu de paramètres pour personnaliser tout ça.
  
Tous les tableaux peuvent être triés en cliquant sur les entêtes de colonne.
  
  Si une URL vers le fichier **app/get.php** est défini(e), le script envoie les données du combat au format JSON via une requête POST.
    
    
get.php
-------

Optionnel.

Nécessite :
   * l'accès à une base de donnée MySQL ou PostgreSQL.
   * fichier `connect-mysql.php` ou `connect-postgres.php` pour s'y connecter.
   * une table `leekwars_data` (la définition de la table est donnée en commentaire dans le fichier PHP).

Receptionne les données.

Envoie les données à la table SQL.

  
Images
-------
![Rapport de combat](http://i.imgur.com/Oo0rJWH.png)
![Résumé](http://i.imgur.com/PaCPDkP.png)
![Graphique](http://i.imgur.com/1Cfm56D.png)
![Utilisation des PT](http://i.imgur.com/Is4cLKL.png)
![Hauts Faits](http://i.imgur.com/6ou1HZW.png)
![sql](http://i.imgur.com/CLil5Rp.png)
