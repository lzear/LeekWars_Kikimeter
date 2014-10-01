<?php

try {	
	$bdd = new PDO('pgsql:[HOST];dbname=[DATABASE]', '[USER]', '[PASSWORD]', array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION));
}
catch (Exception $e){	
	die('Erreur : ' . $e->getMessage());
}

$sqlCreate = "CREATE TABLE IF NOT EXISTS leekwars_data (
  id SERIAL,
  fightId integer NOT NULL,
  bonus integer NULL,
  draw integer NULL,
  nbRounds integer NULL,
  team integer NULL,
  leekId integer NULL,
  name varchar(255) NULL,
  level integer NULL,
  XP integer NULL,
  gainXP integer NULL,
  gainTalent integer NULL,
  gainHabs integer NULL,
  alive integer NULL,
  roundsPlayed integer NULL,
  equipWeapon integer NULL,
  actionsWeapon integer NULL,
  actionsChip integer NULL,
  usedPM integer NULL,
  usedPT integer NULL,
  dmg_in integer NULL,
  dmg_out integer NULL,
  heal_in integer NULL,
  heal_out integer NULL,
  fails integer NULL,
  lastHits integer NULL,
  blabla integer NULL,
  crashes integer NULL,
  PRIMARY KEY (id),
  UNIQUE (fightId, leekId, team)
);";

try {
	$queryCreate = $bdd->prepare($sqlCreate);
	$resCreate = $queryCreate->execute();
}
catch (Exception $e) {
	die('Erreur : ' . $e->getMessage());
}