import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Event } from "@/lib/types";
import { MapPin, Users, Plus } from "lucide-react";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  period: z.enum(["morning", "afternoon", "night"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  location: z.string().optional(),
  emoji: z.string().optional(),
  privacy: z.enum(["private", "partner", "public"]),
  recurrence: z.enum(["none", "daily", "weekly", "monthly", "custom"]),
  recurrenceEndDate: z.string().optional(),
  isSpecial: z.boolean().default(false),
  partners: z
    .array(
      z.object({
        userId: z.string(),
        permission: z.enum(["view", "edit"]),
      })
    )
    .optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editEvent?: Event;
  defaultPeriod?: string;
}

export default function EventFormModal({
  isOpen,
  onClose,
  editEvent,
  defaultPeriod,
}: ModalProps & EventFormModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmoji, setSelectedEmoji] = useState(editEvent?.emoji || "📅");
  const [seletedPeriodUpdated, setSectedPeriodUpdated] = useState(
    editEvent?.period ||
      defaultPeriod ||
      ("morning" as "morning" | "afternoon" | "night")
  );

  const commonEmojis = [
    "📅",
    "🎯",
    "🎉",
    "👥",
    "🍽️",
    "💼",
    "💬",
    "🛒",
    "🏋️",
    "📚",
    "🎮",
    "🧘",
  ];

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: editEvent
      ? {
          title: editEvent.title,
          date: editEvent.date,
          period:
            (editEvent.period as "morning" | "afternoon" | "night") ||
            (seletedPeriodUpdated as "morning" | "afternoon" | "night"),
          startTime: editEvent.startTime,
          endTime: editEvent.endTime || "",
          location: editEvent.location || "",
          emoji: editEvent.emoji || "📅",
          privacy: editEvent.privacy as "private" | "partner" | "public",
          recurrence: editEvent.recurrence as
            | "none"
            | "daily"
            | "weekly"
            | "monthly"
            | "custom",
          recurrenceEndDate: editEvent.recurrenceEndDate || undefined,
          isSpecial: editEvent.isSpecial || false,
        }
      : {
          title: "",
          date: new Date().toISOString().split("T")[0],
          period: seletedPeriodUpdated as "morning" | "afternoon" | "night",
          startTime: "09:00",
          endTime: "10:00",
          location: "",
          emoji: "📅",
          privacy: "private",
          recurrence: "none",
          recurrenceEndDate: new Date().toISOString().split("T")[0],
          isSpecial: false,
        },
  });

  useEffect(() => {
    setSectedPeriodUpdated(defaultPeriod as "morning" | "afternoon" | "night");
  }, [defaultPeriod]);

  const { data: partners } = useQuery({
    queryKey: ["/api/partners"],
    queryFn: async () => {
      const res = await fetch("/api/partners", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch partners");
      return res.json();
    },
    enabled: isOpen,
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormValues) => {
      const res = await apiRequest("POST", "/api/events", {
        ...data,
        emoji: selectedEmoji,
        ownerId: user?.id,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: t("eventForm.successTitle"),
        description: t("eventForm.successDescription"),
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: t("eventForm.errorTitle"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: EventFormValues) => {
      if (!editEvent) throw new Error("No event to update");
      const res = await apiRequest("PUT", `/api/events/${editEvent.id}`, {
        ...data,
        emoji: selectedEmoji,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: t("eventForm.updateSuccessTitle"),
        description: t("eventForm.updateSuccessDescription"),
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: t("eventForm.errorTitle"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: EventFormValues) => {
    const formattedValues = {
      ...values,
      date: new Date(values.date).toISOString().split("T")[0],
      partners: partners
        ?.filter((partner: any) => partner.selected)
        .map((partner: any) => ({
          userId: partner.id,
          permission: partner.permission,
        })),
    };

    if (editEvent) {
      updateEventMutation.mutate(formattedValues);
    } else {
      createEventMutation.mutate(formattedValues);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/50" />
        <DialogContent className="fixed inset-0 m-auto max-w-lg bg-white p-6 rounded shadow">
          <DialogTitle className="text-xl font-bold">
            {editEvent ? "Edit Event" : "Create Event"}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Fill out the form below to {editEvent ? "update" : "create"} your event.
          </DialogDescription>
          <DialogClose className="absolute top-4 right-4">
            <button aria-label="Close">✕</button>
          </DialogClose>
          <div className="p-6">
            <h3 className="text-xl font-medium mb-4">
              {editEvent ? t("eventForm.editTitle") : t("eventForm.createTitle")}
            </h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("eventForm.titleLabel")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("eventForm.titlePlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("eventForm.dateLabel")}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("eventForm.periodLabel")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("eventForm.periodPlaceholder")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="morning">
                              {t("eventForm.periodMorning")}
                            </SelectItem>
                            <SelectItem value="afternoon">
                              {t("eventForm.periodAfternoon")}
                            </SelectItem>
                            <SelectItem value="night">
                              {t("eventForm.periodNight")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("eventForm.startTimeLabel")}</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("eventForm.endTimeLabel")}</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("eventForm.locationLabel")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                            size={16}
                          />
                          <Input
                            placeholder={t("eventForm.locationPlaceholder")}
                            className="pl-9"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                />

                <FormField
                  control={form.control}
                  name="recurrence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("eventForm.recurrenceLabel")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("eventForm.recurrencePlaceholder")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent></SelectContent>
              {form.getValues("recurrence") !== "none" && (
                <FormField
                  control={form.control}
                  name="recurrenceEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("eventForm.recurrenceEndDateLabel")}
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div>
                <FormLabel>{t("eventForm.emojiLabel")}</FormLabel>
                <div className="grid grid-cols-6 gap-2 mt-1">
                  {commonEmojis.map((emoji) => (
                    <Button
                      key={emoji}
                      type="button"
                      variant="outline"
                      className={`p-2 text-xl ${
                        selectedEmoji === emoji
                          ? "border-primary bg-primary/10"
                          : ""
                      }`}
                      onClick={() => setSelectedEmoji(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="privacy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("eventForm.privacyLabel")}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="private" id="private" />
                          <label
                            htmlFor="private"
                            className="text-sm text-neutral-700 cursor-pointer"
                          >
                            {t("eventForm.privacyPrivate")}
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="partner" id="partner" />
                          <label
                            htmlFor="partner"
                            className="text-sm text-neutral-700 cursor-pointer"
                          >
                            {t("eventForm.privacyPartner")}
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="public" id="public" />
                          <label
                            htmlFor="public"
                            className="text-sm text-neutral-700 cursor-pointer"
                          >
                            {t("eventForm.privacyPublic")}
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {((field: string) => field === "partner" || field === "public")(
                form.watch("privacy")
              ) && (
                <div className="border-t border-neutral-200 pt-4">
                  <FormLabel className="block mb-3">
                    {t("eventForm.shareWithLabel")}
                  </FormLabel>

                  {partners && partners.length > 0 ? (
                    partners.map((partner: any) => (
                      <div
                        key={partner.id}
                        className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg mb-2"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center">
                            <span className="text-sm">
                              {partner.partner.fullName.substring(0, 2)}
                            </span>
                          </div>
                          <span className="ml-3 font-medium">
                            {partner.partner.fullName}
                          </span>
                        </div>
                        <Select
                          defaultValue="view"
                          onValueChange={(value) => {
                            const updatedPartners =
                              form.getValues("partners") || [];
                            const partnerIndex = updatedPartners.findIndex(
                              (p: any) => p.userId === partner.id
                            );
                            if (partnerIndex > -1) {
                              updatedPartners[partnerIndex].permission =
                                value as "view" | "edit";
                            } else {
                              updatedPartners.push({
                                userId: partner.id,
                                permission: value as "view" | "edit",
                              });
                            }
                            form.setValue("partners", updatedPartners);
                          }}
                        >
                          <SelectTrigger className="text-sm border border-neutral-200 rounded p-1 h-auto min-h-0 w-28">
                            <SelectValue
                              placeholder={t("eventForm.permissionPlaceholder")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">
                              {t("eventForm.permissionView")}
                            </SelectItem>
                            <SelectItem value="edit">
                              {t("eventForm.permissionEdit")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))
                  ) : (
                    <div className="text-neutral-500 text-sm mb-2">
                      {t("eventForm.noPartnersMessage")}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="link"
                    className="flex items-center text-primary p-0 h-auto text-sm"
                  >
                    <Plus className="mr-1" size={16} />{" "}
                    {t("eventForm.addPeopleButton")}
                  </Button>
                </div>
              )}

              <FormField
                control={form.control}
                name="partners"
                render={() => (
                  <FormItem>
                    <FormLabel>{t("eventForm.partnersLabel")}</FormLabel>
                    {partners && partners.length > 0 ? (
                           partners.map((partner: any) => (
                        <div
                          key={partner.id}
                          className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg mb-2"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center">
                              <span className="text-sm">
                                {partner.partner.fullName.substring(0, 2)}
                              </span>
                            </div>
                            <span className="ml-3 font-medium">
                              {partner.partner.fullName}
                            </span>
                          </div>
                          <Select
                            defaultValue="view"
                            onValueChange={(value) => {
                              const updatedPartners =
                                form.getValues("partners") || [];
                              const partnerIndex = updatedPartners.findIndex(
                                (p: any) => p.userId === partner.id
                              );
                              if (partnerIndex > -1) {
                                updatedPartners[partnerIndex].permission =
                                  value as "view" | "edit";
                              } else {
                                updatedPartners.push({
                                  userId: partner.id,
                                  permission: value as "view" | "edit",
                                });
                              }
                              form.setValue("partners", updatedPartners);
                            }}
                          >
                            <SelectTrigger className="text-sm border border-neutral-200 rounded p-1 h-auto min-h-0 w-28">
                              <SelectValue
                                placeholder={t(
                                  "eventForm.permissionPlaceholder"
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="view">
                                {t("eventForm.permissionView")}
                              </SelectItem>
                              <SelectItem value="edit">
                                {t("eventForm.permissionEdit")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))
                    ) : (
                      <div className="text-neutral-500 text-sm mb-2">
                        {t("eventForm.noPartnersMessage")}
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <div className="p-4 border-t border-neutral-200 flex justify-end">
          <Button variant="outline" onClick={onClose} className="mr-2">
            {t("eventForm.cancelButton")}
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)}>
            {editEvent
              ? t("eventForm.updateButton")
              : t("eventForm.saveButton")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
