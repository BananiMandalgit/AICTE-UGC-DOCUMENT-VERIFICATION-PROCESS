import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Shield } from "lucide-react";
import { useInstituteLogin } from "@/hooks/useInstituteAuth";
import { BackgroundLayout } from "@/components/BackgroundLayout";
import AicteImage from "@/assets/aicte-logo.webp";

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export default function InstituteOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginMutation = useInstituteLogin();
  const email = searchParams.get("email") || "";

  useEffect(() => {
    if (!email) {
      navigate("/institute/login", { replace: true });
    }
  }, [email, navigate]);

  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const onSubmit = ({ otp }: z.infer<typeof otpSchema>) => {
    if (!email) return;
    loginMutation.mutate({ email, otp });
  };

  return (
    <BackgroundLayout>
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <img src="/approval-enginex-logo.png" alt="Approval Enginex Logo" className="mx-auto mb-4 h-24 w-24" />
          <h1 className="text-3xl font-bold text-[#2c3e50]">
            Verify OTP
          </h1>
          {email && (
            <p className="text-sm text-[#2c3e50] mt-2">
              Sent to <span className="font-semibold">{email}</span>
            </p>
          )}
        </motion.div>

        <Card className="w-[400px] shadow-lg">
          <CardHeader className="bg-[#f8f9fa]">
            <CardTitle className="text-[#2c3e50]">Enter OTP</CardTitle>
            <CardDescription className="text-[#2c3e50]">
              Enter the 6-digit code to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#2c3e50]">OTP</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            maxLength={6}
                            className="pl-10 border-[#3498db] focus:border-[#2ecc71] tracking-[0.5em] text-center"
                          />
                          <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#3498db]" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-[#2ecc71] hover:bg-[#27ae60] text-white"
                >
                  {!loginMutation.isPending ? (
                    "Verify & Login"
                  ) : (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </BackgroundLayout>
  );
}