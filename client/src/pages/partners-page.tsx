import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  UserPlus,
  Check,
  X,
  Mail,
  Calendar,
  User,
  Clock,
  ChevronRight,
  Clock3,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Partner } from "@/lib/types";
import { format } from "date-fns";
import InvitePartnerModal from "@/components/ui/invite-partner-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/ui/header";

export default function PartnersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Fetch partner requests
  const { data: partnerRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/partners/requests"],
    queryFn: async () => {
      const res = await fetch("/api/partners/requests", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch partner requests");
      return res.json();
    },
  });

  // Fetch active partners
  const { data: partners, isLoading: isLoadingPartners } = useQuery({
    queryKey: ["/api/partners"],
    queryFn: async () => {
      const res = await fetch("/api/partners", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch partners");
      return res.json();
    },
  });

  // Handle accept/reject partner request
  const updatePartnerStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/partners/${id}/status`, {
        status,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({
        title: "Partner status updated",
        description: "The partner request has been processed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating partner status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAcceptRequest = (id: number) => {
    updatePartnerStatusMutation.mutate({ id, status: "accepted" });
  };

  const handleRejectRequest = (id: number) => {
    updatePartnerStatusMutation.mutate({ id, status: "rejected" });
  };

  const handleUpdatePartnerStatus = (
    id: number,
    status: "accepted" | "rejected"
  ) => {
    updatePartnerStatusMutation.mutate(
      { id, status },
      {
        onSuccess: () => {
          toast({
            title:
              status === "accepted" ? "Partner accepted" : "Partner rejected",
            description: `The partner request has been ${status}.`,
          });
          queryClient.invalidateQueries({
            queryKey: ["/api/partners/requests"],
          });
          queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
        },
        onError: (error) => {
          toast({
            title: "Error updating partner status",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden bg-neutral-50">
        {/* Header */}
        <Header />
        <header className="bg-white border-b border-neutral-200 py-3 px-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-heading font-bold text-neutral-900">
              Partners
            </h1>
            <p className="text-sm text-neutral-500">
              Manage your calendar sharing
            </p>
          </div>

          <Button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center"
          >
            <UserPlus className="mr-2" size={18} />
            Invite Partner
          </Button>
        </header>

        {/* Main Content */}
        <div className="p-4 md:p-6 overflow-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Partner Requests Section */}
            {partnerRequests && partnerRequests.length > 0 && (
              <section>
                <h2 className="text-lg font-medium mb-4 flex items-center">
                  <Clock3 className="mr-2 text-orange-500" size={20} />
                  Pending Requests
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partnerRequests.map((request: Partner) => (
                    <Card key={request.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3 bg-orange-500 text-white">
                              <AvatarFallback>
                                {getInitials(request.partner.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">
                                {request.partner.fullName}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {request.partner.email}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200"
                          >
                            Pending
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm text-neutral-600 py-2">
                        <p>
                          Sent on{" "}
                          {format(new Date(request.createdAt), "MMMM d, yyyy")}
                        </p>
                        <p className="mt-1">
                          {request.shareAll
                            ? "All events will be shared"
                            : request.shareRaftOnly
                            ? "Only Raft events will be shared"
                            : "Selected calendars will be shared"}
                        </p>
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={updatePartnerStatusMutation.isPending}
                        >
                          <X className="mr-1" size={14} />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={updatePartnerStatusMutation.isPending}
                        >
                          <Check className="mr-1" size={14} />
                          Accept
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Active Partners Section */}
            <section>
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <User className="mr-2 text-green-500" size={20} />
                My Partners
              </h2>

              {isLoadingPartners ? (
                <div className="text-center py-8 text-neutral-500">
                  Loading partners...
                </div>
              ) : partners && partners.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partners.map((partner: Partner) => (
                    <Card key={partner.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3 bg-secondary text-white">
                              <AvatarFallback>
                                {getInitials(partner.partner.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">
                                {partner.partner.fullName}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {partner.partner.email}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Active
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 py-2">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center text-neutral-600">
                            <Calendar className="mr-2" size={14} />
                            {partner.shareAll
                              ? "All events shared"
                              : partner.shareRaftOnly
                              ? "Only Raft events shared"
                              : "Selected calendars shared"}
                          </div>
                          <button className="text-primary text-xs font-medium">
                            Change
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center text-neutral-600">
                            <Clock className="mr-2" size={14} />
                            Connected since{" "}
                            {format(new Date(partner.createdAt), "MMM d, yyyy")}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-neutral-600"
                        >
                          Manage
                          <ChevronRight size={14} className="ml-1" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center p-8">
                  <div className="flex flex-col items-center max-w-sm mx-auto">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Mail className="text-primary" size={28} />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      No partners yet
                    </h3>
                    <p className="text-neutral-500 mb-4">
                      Invite a partner to share your calendar and collaborate on
                      events together.
                    </p>
                    <Button onClick={() => setShowInviteModal(true)}>
                      <UserPlus className="mr-2" size={18} />
                      Invite Partner
                    </Button>
                  </div>
                </Card>
              )}
            </section>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileNav />

        {/* Invite Partner Modal */}
        <InvitePartnerModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
        />
      </div>
    </div>
  );
}
