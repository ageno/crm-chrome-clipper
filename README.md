### Uruchamianie rozszerzenia w chrome z poziomu katalogu
1. Zaznaczyć "developer mode" na górze chrome://extensions
2. W "load unpacked extension" wskazać lokalizację repozytorium na dysku.

### Debugowanie
- popover - prawym na ikonkę rozszerzenia -> inspect popover
- background page (api) - chrome://extensions -> inspect background page
- content scripts (agregatory) - inspektor aktualnie otwartej strony

### Definicja pola w agregatorze (tablica "this.elements")

```
{
  name: string
  selector: string
  modifier: function //modyfikator wartości po wyciągnięciu, a przed zapisaniem do obiektu
  multiple: bool //czy szukać wielu elementów (domyślnie tylko raz)
  value: string/function //pomija wyciąganie wartości z selektora (pozwala użyć customowej funkcji zwracającej string, np link do avatara z facebook graph)
}
```

### Dodawanie agregatora dla nowej strony
- stworzyć plik z klasą CrmAggregator dziedziczący po CrmBaseAggregator
- dodać domenę do "content_scripts" w manifest.json

### Zmiana domeny dla api (np. na lokalną)
- dodać domenę do "permissions" w manifest.json (dostęp do sesji tej domeny)
- w api.js zmienić requestDomain i requestProtocol