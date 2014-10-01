<?php

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
	
include 'app/connect-mysql.php';
// ou remplacer par 'app/connect-postgres.php' si une DB PostgreSQL est utilisée (déployé sur Heroku par exemple)

$d = objectToArray(json_decode($_POST['json'])) ;
foreach($d as $key) {
	$columns = implode(", ",array_keys($key));
	$values  = implode("', '", array_values($key));
	$sql = "INSERT INTO leekwars_data($columns) VALUES ('$values')";
	
	try {
		$sth = $bdd->prepare($sql);
		$res = $sth->execute();
	}
	catch (Exception $e) {
		die('Erreur : ' . $e->getMessage());
	}
}