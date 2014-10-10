<?php

try { 
  $bdd = new PDO('mysql:[HOST];dbname=[DATABASE]', '[USER]', '[PASSWORD]', array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION));
}
catch (Exception $e){ 
  die('Erreur : ' . $e->getMessage());
}

$sqlCreate = "CREATE TABLE IF NOT EXISTS `leekwars_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fightId` int(11) NOT NULL,
  `bonus` int(11) DEFAULT NULL,
  `draw` int(11) DEFAULT NULL,
  `nbRounds` int(11) DEFAULT NULL,
  `team` int(11) DEFAULT NULL,
  `teamName` varchar(255) NOT NULL,
  `farmer` int(11) NOT NULL,
  `leekId` int(11) NOT NULL DEFAULT '0',
  `name` varchar(255) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `XP` int(11) DEFAULT NULL,
  `gainXP` int(11) DEFAULT NULL,
  `gainTalent` int(11) DEFAULT NULL,
  `gainHabs` int(11) DEFAULT NULL,
  `alive` int(11) DEFAULT NULL,
  `lastLife` int(11) NOT NULL,
  `roundsPlayed` int(11) DEFAULT NULL,
  `equipWeapon` int(11) DEFAULT NULL,
  `actionsWeapon` int(11) DEFAULT NULL,
  `actionsChip` int(11) DEFAULT NULL,
  `usedPM` int(11) DEFAULT NULL,
  `usedPT` int(11) DEFAULT NULL,
  `dmg_in` int(11) DEFAULT NULL,
  `dmg_out` int(11) DEFAULT NULL,
  `heal_in` int(11) DEFAULT NULL,
  `heal_out` int(11) DEFAULT NULL,
  `fails` int(11) DEFAULT NULL,
  `lastHits` int(11) DEFAULT NULL,
  `blabla` int(11) DEFAULT NULL,
  `crashes` int(11) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`fightId`,`leekId`),
  KEY `id` (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 AUTO_INCREMENT=1;";

try {
  $queryCreate = $bdd->prepare($sqlCreate);
  $resCreate = $queryCreate->execute();
}
catch (Exception $e) {
  die('Erreur : ' . $e->getMessage());
}
