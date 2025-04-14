import { useTranslation } from 'react-i18next';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
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
        <DropdownMenuItem onClick={() => changeLanguage('en')}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('pt-BR')}>
          Português (BR)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}