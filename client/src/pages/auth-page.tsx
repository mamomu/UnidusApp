import { useState } from "react";
import { Redirect } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Define types before using them
type LoginValues = {
  username: string;
  password: string;
};

type RegisterValues = {
  username: string;
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
};

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { t } = useTranslation();

  // Create schemas with translations
  const loginSchema = z.object({
    username: z.string().min(1, t("auth.username") + " " + t("common.error")),
    password: z.string().min(1, t("auth.password") + " " + t("common.error")),
  });

  const registerSchema = z.object({
    username: z.string().min(3, t("auth.username") + " " + t("common.error")),
    email: z.string().email("Must be a valid email address"),
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    password: z.string().min(6, t("auth.password") + " " + t("common.error")),
    confirmPassword: z.string().min(6, t("auth.confirmPassword") + " " + t("common.error")),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  // Login form
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Form submission handlers
  const onLoginSubmit = (values: LoginValues) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: RegisterValues) => {
    // Omit confirmPassword when submitting
    const { confirmPassword, ...registerData } = values;
    registerMutation.mutate(registerData);
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side: Forms */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="text-center mb-4">
              <h1 className="text-3xl font-heading font-bold text-primary flex items-center justify-center">
                <i className="ri-calendar-line mr-2"></i> {t("app.name")}
              </h1>
              <CardDescription>{t("app.tagline")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
                <TabsTrigger value="register">{t("auth.register")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.username")}</FormLabel>
                          <FormControl>
                            <Input placeholder={`${t("auth.username")}...`} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.password")}</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder={`${t("auth.password")}...`} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("common.loading")}
                        </>
                      ) : t("auth.login")}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <span className="text-sm text-neutral-500">
              {activeTab === "login" ? t("auth.createNewAccount") : t("auth.alreadyHaveAccount")}
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary" 
                onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
              >
                {activeTab === "login" ? t("auth.register") : t("auth.login")}
              </Button>
            </span>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right side: Hero Banner */}
      <div className="hidden md:flex md:flex-1 bg-primary text-white">
        <div className="max-w-lg mx-auto flex flex-col justify-center p-8">
          <h1 className="text-4xl font-heading font-bold mb-6">Simplify your shared schedules</h1>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <i className="ri-calendar-check-line text-2xl"></i>
              </div>
              <div>
                <h3 className="font-medium text-xl mb-1">Period-Based Organization</h3>
                <p className="text-white/80">See your day divided into morning, afternoon, and night periods for better clarity.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <i className="ri-team-line text-2xl"></i>
              </div>
              <div>
                <h3 className="font-medium text-xl mb-1">Partner Collaboration</h3>
                <p className="text-white/80">Share your calendar with your partner and collaborate on events easily.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <i className="ri-discuss-line text-2xl"></i>
              </div>
              <div>
                <h3 className="font-medium text-xl mb-1">Interactive Events</h3>
                <p className="text-white/80">Comment, react, and discuss directly within events for seamless coordination.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
