import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings, LogOut, Globe, Bell, Moon, Sun, PaintBucket } from "lucide-react";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />
      
      <div className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="container max-w-4xl py-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
              <p className="text-muted-foreground">
                {t("settings.description")}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                {t("auth.logout")}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general" className="gap-2">
                <Settings className="h-4 w-4" />
                {t("settings.tabs.general")}
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-2">
                <PaintBucket className="h-4 w-4" />
                {t("settings.tabs.appearance")}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                {t("settings.tabs.notifications")}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.language.title")}</CardTitle>
                  <CardDescription>
                    {t("settings.language.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">{t("settings.language.select")}</Label>
                    <Select 
                      defaultValue={i18n.language} 
                      onValueChange={(value) => i18n.changeLanguage(value)}
                    >
                      <SelectTrigger id="language" className="w-full md:w-[240px]">
                        <SelectValue placeholder={t("settings.language.select")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.account.title")}</CardTitle>
                  <CardDescription>
                    {t("settings.account.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="username">{t("auth.username")}</Label>
                        <div className="mt-1 font-medium">{user?.username}</div>
                      </div>
                      
                      <div>
                        <Label htmlFor="email">{t("auth.email")}</Label>
                        <div className="mt-1 font-medium">{user?.email}</div>
                      </div>
                      
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <div className="mt-1 font-medium">{user?.fullName}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.theme.title")}</CardTitle>
                  <CardDescription>
                    {t("settings.theme.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="theme-mode">{t("settings.theme.darkMode")}</Label>
                      <span className="text-sm text-muted-foreground">
                        {t("settings.theme.darkModeDescription")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Sun className="h-4 w-4" />
                      <Switch id="theme-mode" />
                      <Moon className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.notifications.title")}</CardTitle>
                  <CardDescription>
                    {t("settings.notifications.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t("settings.notifications.events")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("settings.notifications.eventsDescription")}
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t("settings.notifications.partners")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("settings.notifications.partnersDescription")}
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t("settings.notifications.comments")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("settings.notifications.commentsDescription")}
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}