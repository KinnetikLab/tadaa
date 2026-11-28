-- El sitio se mudó de /experience/ a la raíz: actualiza las rutas guardadas.
UPDATE invite_campaigns SET site_url=regexp_replace(site_url,'^/experience/','/') WHERE site_url LIKE '/experience/%';
UPDATE user_notifications SET action_url=regexp_replace(action_url,'^/experience/','/') WHERE action_url LIKE '/experience/%';
UPDATE event_extras SET hero_url=regexp_replace(hero_url,'^/experience/','/') WHERE hero_url LIKE '/experience/%';
UPDATE event_extras SET poster_url=regexp_replace(poster_url,'^/experience/','/') WHERE poster_url LIKE '/experience/%';
UPDATE event_addons SET image_url=regexp_replace(image_url,'^/experience/','/') WHERE image_url LIKE '/experience/%';
UPDATE merch_products SET image_url=regexp_replace(image_url,'^/experience/','/') WHERE image_url LIKE '/experience/%';
UPDATE pitch_decks SET logo_url=regexp_replace(logo_url,'^/experience/','/') WHERE logo_url LIKE '/experience/%';
