<?php
/*
--
-- Structure de la table `leekwars_data`
--
CREATE TABLE IF NOT EXISTS `leekwars_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fightId` int(11) NOT NULL,
  `bonus` int(11) NOT NULL,
  `draw` int(11) NOT NULL,
  `nbRounds` int(11) NOT NULL,
  `team` int(11) NOT NULL,
  `leekId` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `level` int(11) NOT NULL,
  `XP` int(11) NOT NULL,
  `gainXP` int(11) NOT NULL,
  `gainTalent` int(11) NOT NULL,
  `gainHabs` int(11) NOT NULL,
  `alive` int(11) NOT NULL,
  `roundsPlayed` int(11) NOT NULL,
  `equipWeapon` int(11) NOT NULL,
  `actionsWeapon` int(11) NOT NULL,
  `actionsChip` int(11) NOT NULL,
  `PM` int(11) NOT NULL,
  `PT` int(11) NOT NULL,
  `dmg_in` int(11) NOT NULL,
  `dmg_out` int(11) NOT NULL,
  `heal_in` int(11) NOT NULL,
  `heal_out` int(11) NOT NULL,
  `fails` int(11) NOT NULL,
  `lastHits` int(11) NOT NULL,
  `blabla` int(11) NOT NULL,
  `crashes` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ukey` (`fightId`, `leekId`, `team`),
  KEY `id` (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;


--
-- Contenu de `connect.php` (remplacer les données entre crochets [] ) :
--
<?php
try
{	$bdd = new PDO('mysql:host=[HOST];dbname=[DBNAME]', '[USER]', '[PASSWORD]', array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION));
}
catch (Exception $e)
{	die('Erreur : ' . $e->getMessage());
}
?>

*/

header("Content-Type: text/plain");
header("Access-Control-Allow-Origin: *"); 

function objectToArray($d) {
		if (is_object($d)) {
			$d = get_object_vars($d);
		}
		if (is_array($d)) {
			return array_map(__FUNCTION__, $d);
		}
		else {
			return $d;
		}
	}
	
include 'connect.php';

$d = objectToArray(json_decode($_POST['json'])) ;
foreach($d as $key)
{
	$columns = implode(", ",array_keys($key));
	$values  = implode("', '", array_values($key));
	$sql = "INSERT INTO `leekwars_data`($columns) VALUES ('$values')";
	
	try
	{
		$sth = $bdd->prepare($sql);
		$res = $sth->execute();
	}
	catch (Exception $e)
	{
		die('Erreur : ' . $e->getMessage());
	}
}

?>