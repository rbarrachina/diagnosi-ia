UPDATE `app_settings`
SET `setting_value` = REPLACE(
  `setting_value`,
  'Les respostes són anònimes i els resultats es tractaran sempre de manera agregada.',
  'No es demana el nom docent. El correu només es conserva durant la sessió per validar el domini i no es desa a la base de dades ni es vincula a les respostes. Cada participant pot recuperar els seus resultats amb el mateix compte, mentre que el centre només veu dades agregades.'
)
WHERE `setting_key` = 'communication_body'
  AND `setting_value` LIKE '%Les respostes són anònimes i els resultats es tractaran sempre de manera agregada.%';
--> statement-breakpoint
UPDATE `app_settings`
SET `setting_value` = REPLACE(
  `setting_value`,
  'No es desa el nom ni el correu docent.',
  'No es demana el nom docent. El correu només es conserva durant la sessió per validar el domini i no es desa a la base de dades ni es vincula a les respostes.'
)
WHERE `setting_key` = 'communication_body'
  AND `setting_value` LIKE '%No es desa el nom ni el correu docent.%';
