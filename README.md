LeekWars_Kikimeter
==================
Les fichiers de ce Git sont un outil pour les joueurs du jeu [LeekWars](http://leekwars.com/), créé suite à [une suggestion](http://leekwars.com/forum/category-4/topic-1618)


kikimeter.js
------------

script JavaScript pour TamperMonkey ou GreaseMonkey.
  
  Affiche des statistiques complémentaires dans le rapport de combat :
  - un tableau des statistiques du combat ;
  - un tableau de synthèse de l'usage des PT ;
  - une série de hauts faits.
  
Tous les tableaux peuvent être triés en cliquant sur les entêtes de colonne.
  
  Si une URL vers le fichier **get.php** est défini(e), le script envoie les données du combat au format JSON via une requête POST.
    
    
get.php
-------

Optionnel.

Nécessite :
   * l'accès à une base de donnée.
   * fichier `connect.php` pour s'y connecter.
   * une table `leekwars_data` (la définition de la table est donnée en commentaire dans le fichier PHP).

Receptionne les données.

Envoie les données à la table SQL.

  
Images
-------
![Rapport de combat](http://i.imgur.com/gN88pKu.png)
![Résumé](http://i.imgur.com/PaCPDkP.png)
![Utilisation des PT](http://i.imgur.com/Is4cLKL.png)
![Hauts Faits](http://i.imgur.com/6ou1HZW.png)
![sql](http://i.imgur.com/CLil5Rp.png)
