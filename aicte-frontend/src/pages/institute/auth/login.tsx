import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useInstituteExists, useSendInstituteOtp } from "@/hooks/useInstituteAuth";
import { Loader2, Mail, Lock } from "lucide-react";
import { BackgroundLayout } from "@/components/BackgroundLayout";
import AicteImage from "@/assets/aicte-logo.webp";
import { useAuthStore } from "@/hooks/useAuthStore";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "University email is required")
    .email("Enter a valid email"),
});

export default function LoginPage() {
  const { token, mode } = useAuthStore();
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('source') === 'ugc') {
      localStorage.setItem('loginSource', 'ugc');
    } else {
      localStorage.setItem('loginSource', 'aicte');
    }
  }, []);
  const navigate = useNavigate();
  const { toast } = useToast();
  const instituteExistsMutation = useInstituteExists();
  const sendOtpMutation = useSendInstituteOtp();

  useEffect(() => {
    if (token && mode === "institute") {
      navigate("/institute/dashboard", { replace: true });
    }
  }, [token, mode, navigate]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  });
  const onSubmit = async ({ email }: z.infer<typeof loginSchema>) => {
    const trimmed = email.trim();

    if (!trimmed) {
      toast({ description: "University email is required" });
      return;
    }

    let exists: boolean;
    try {
      const res = await instituteExistsMutation.mutateAsync(trimmed);
      exists =
        res?.exists ??
        res?.data?.exists ??
        res?.data?.success ??
        res?.success ??
        false;
    } catch {
      return;
    }

    if (!exists) {
      toast({ description: "Institute does not exist" });
      return;
    }

    try {
      await sendOtpMutation.mutateAsync(trimmed);
      toast({
        title: "OTP Sent",
        description: "Check your registered email for the verification code.",
      });
      navigate(`/institute/auth/otp?email=${encodeURIComponent(trimmed)}`);
    } catch {
      // errors handled in hook toast
    }
  };

  const isSubmitting =
    instituteExistsMutation.isPending || sendOtpMutation.isPending;

  return (
    <BackgroundLayout>
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <img
            src="/approval-enginex-logo.png"
            alt="Approval Enginex Logo"
            className="mx-auto mb-6 h-32 w-32"
          />
          <h1 className="text-3xl font-bold text-[#2c3e50]">
            {(() => {
              const params = new URLSearchParams(window.location.search);
              return params.get('source') === 'ugc' ? 'UGC Institute Login' : 'AICTE Institute Login';
            })()}
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-[400px] shadow-lg">
            <CardHeader className="bg-[#f8f9fa]">
              <CardTitle className="text-[#2c3e50] flex items-center">
                <Lock className="mr-2 text-[#3498db]" />
                Login
              </CardTitle>
              <CardDescription className="text-[#2c3e50]">
                Access your AICTE institute account
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#2c3e50]">
                          University Email
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              className="pl-10 border-[#3498db] focus:border-[#2ecc71]"
                              autoComplete="email"
                            />
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#3498db]" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#0b6e4f] hover:bg-[#095a40] text-white"
                  >
                    {!isSubmitting ? (
                      "Send OTP"
                    ) : (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending OTP
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col items-center space-y-2 bg-[#f8f9fa] p-4">
              <Link
                to="/institute/auth/register"
                className="text-sm text-[#3498db] hover:underline"
              >
                Back to Registration
              </Link>
              <Link
                to="/institute/forgot"
                className="text-sm text-[#3498db] hover:underline"
              >
                Recover Password
              </Link>
              <p className="text-xs text-[#2c3e50]">
                For any login issues, please contact AICTE support
              </p>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 text-center text-sm text-[#2c3e50]"
        >
          <p>All India Council for Technical Education</p>
          <p>Nelson Mandela Marg, Vasant Kunj, New Delhi-110070</p>
        </motion.div>
      </div>
    </BackgroundLayout>
  );
}
