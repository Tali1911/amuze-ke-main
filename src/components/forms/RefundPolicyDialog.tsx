import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export const RefundPolicyDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="text-center">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="link" 
            className="h-auto p-0 text-sm text-primary underline"
            type="button"
          >
            View Refund Policy
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Amuse Kenya - Refund Policy</DialogTitle>
            <DialogDescription>
              Please review our refund policy below
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[65vh] pr-4">
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2">1. Scope and Applicability</h3>
                <p className="leading-relaxed mb-2">
                  This refund policy applies to all bookings for camps, birthday events, school programmes, outdoor adventures, and bespoke events offered by Amuse Kenya.
                </p>
                <p className="leading-relaxed">
                  It does not apply to incidental fees such as entrance charges to Karura Forest or bike rentals, which follow separate terms.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">2. Eligibility for Refunds</h3>
                <p className="leading-relaxed mb-2">
                  Refunds are available only when cancellation is requested at least 7 days before the scheduled date of the booked service.
                </p>
                <p className="leading-relaxed">
                  Any cancellations made within 7 days of the booking date will be eligible to 50% refund, or 48hrs to the event —will not be eligible for refunds.
                </p>
                <p className="leading-relaxed">
                  Refunds apply solely to the service fees charged directly by Amuse Kenya. External levies—such as park entry fees—are non-refundable.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">3. How to Request a Refund</h3>
                <p className="leading-relaxed mb-2">
                  1. Email us at <span className="font-semibold">info@amusekenya.co.ke</span> or call <span className="font-semibold">0114 705 763</span>, clearly stating:
                </p>
                <ul className="list-disc pl-6 space-y-1 mb-3">
                  <li>Booking reference/order number</li>
                  <li>Customer name and contact details</li>
                  <li>Date of the event</li>
                  <li>Reason for cancellation</li>
                </ul>
                <p className="leading-relaxed">
                  2. Once received, we will acknowledge your request within 2 business days and inform you whether the refund is approved.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">4. Refund Processing & Method</h3>
                <p className="leading-relaxed">
                  Approved refunds will be processed within 5 business days, using the original payment method.
                </p>
                <p className="leading-relaxed">
                  Please note that processing times may vary depending on your bank or payment provider.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">5. Exceptions (No Refund)</h3>
                <p className="leading-relaxed mb-2">
                  Customized and bespoke services (e.g., private theme setups or custom school sessions) are non-refundable once confirmed.
                </p>
                <p className="leading-relaxed mb-2">
                  Any bookings that include non-refundable <span className="underline">addons</span>—like exclusive venue hire or specially procured items—are excluded.
                </p>
                <p className="leading-relaxed">
                  No refunds for no-shows or late arrivals.
                </p>
                <p className="leading-relaxed">
                  If cancellations arise from <span className="italic">force majeure</span> events (e.g., severe weather, government directives, or public health restrictions), we'll offer alternatively: Rescheduling to another available date or settle it amicably.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">6. Policy Updates</h3>
                <p className="leading-relaxed">
                  Amuse Kenya reserves the right to update this policy at any time. You can always view the current version on our website or contact us directly for details.
                </p>
              </section>

              <section className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-base mb-3 italic">Why This Policy Works for Amuse Kenya</h3>
                <p className="leading-relaxed mb-3 italic">
                  Reflects the locally-focused, experiential nature of your services—especially relevant for time-sensitive bookings like camps and events.
                </p>
                <p className="leading-relaxed mb-3 italic">
                  Sets clear expectations with a reasonable cancellation window (7 days and 48hrs), balancing your operational planning needs and customer's fairness.
                </p>
                <p className="leading-relaxed italic">
                  Provides flexibility for exceptional circumstances via <span className="italic">force majeure</span> provisions.
                </p>
              </section>

              <div className="border-t pt-4 mt-4">
                <p className="leading-relaxed">
                  For any questions or concerns, please contact us at <span className="font-semibold">0114 705 763</span> or <span className="font-semibold">info@amusekenya.co.ke</span>
                </p>
                <p className="mt-4">
                  <span className="font-semibold">Amuse Kenya</span><br />
                  Karura Forest Sigiria, Nairobi, Kenya
                </p>
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end">
            <Button onClick={() => setOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
