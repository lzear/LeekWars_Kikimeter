LeekWars_Kikimeter
==================
Les fichiers de ce Git sont un outil pour les joueurs du jeu LeekWars.com ,
crée suite à une suggestion :  http://leekwars.com/forum/category-4/topic-1618


kikimeter.js : script JavaScript qui s'utilise avec TamperMonkey ou GreaseMonkey
  Affiche un tableau de résumé des combat
  
  Si un(e?) URL vers le fichier get.php est définie,
    le script envoie les données du combat au format JSON via une requête POST
    
    
    
get.php : Optionnel, nécessite l'accès à une base de donnée
  Receptionne les données
  Envoie les données à une table SQL
  (la définition de la table est donnée en commentaire)
  
