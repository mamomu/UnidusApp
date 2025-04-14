import { useTranslation } from 'react-i18next';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Globe, Settings } from 'lucide-react';
import { useLocation } from 'wouter';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [_, setLocation] = useLocation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleGoToSettings = () => {
    setLocation('/settings');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t('app.lang')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('app.lang')}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => changeLanguage('en')}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('pt-BR')}>
          Português (BR)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleGoToSettings}>
          <Settings className="mr-2 h-4 w-4" />
          {t('settings.title')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}