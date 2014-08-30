LeekWars_Kikimeter
==================
Les fichiers de ce Git sont un outil pour les joueurs du jeu [LeekWars](http://leekwars.com/), créé suite à [une suggestion](http://leekwars.com/forum/category-4/topic-1618)


kikimeter.js
------------

script JavaScript pour TamperMonkey ou GreaseMonkey.
  
  Affiche un tableau de résumé des combats et une série de hauts faits.
  
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
![tableau](http://i.imgur.com/EtnGsZm.png)
![sql](http://i.imgur.com/CLil5Rp.png)
![Hauts Faits](http://i.imgur.com/flQfmGT.png)
![Hauts Faits](http://i.imgur.com/FQP1NX1.png)
![Hauts Faits](http://i.imgur.com/BTIfVWs.png)
