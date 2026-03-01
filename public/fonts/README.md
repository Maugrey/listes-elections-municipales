# Police Marianne — Instructions d'installation

La police Marianne est la police officielle du système de design de l'État français.
Elle n'est pas distribuée dans ce dépôt pour des raisons de licence.

## Téléchargement

1. Rendez-vous sur : https://www.systeme-de-design.gouv.fr/fondamentaux/typographie
2. Téléchargez le kit de la police Marianne
3. Extrayez les fichiers `.woff2` suivants dans ce dossier (`public/fonts/`) :

```
public/fonts/
├── Marianne-Light.woff2
├── Marianne-Regular.woff2
├── Marianne-Medium.woff2
└── Marianne-Bold.woff2
```

## Fallback

En l'absence des fichiers, l'application utilisera `system-ui, sans-serif` comme police de secours.
Le layout et le style resteront fonctionnels.
