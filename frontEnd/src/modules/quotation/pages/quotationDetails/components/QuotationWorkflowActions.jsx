import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import VariantButton from "../../../../../shared/components/buttons/VariantButton";
import { quotationActions } from "../../../quotation.access";
import {
  approveQuotationAPI, rejectQuotationAPI, submitQuotationAPI, reopenQuotationAPI, convertQuotationAPI,
} from "../../../services/quotation.api";

const QuotationWorkflowActions = ({ quotation, user, disabled, onChanged, onBusyChange }) => {
  const actions = quotationActions(user, quotation);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [convertedOrder, setConvertedOrder] = useState(null);
  const pendingRef = useRef(false);
  const requestVersion = useRef(0);
  const onBusyChangeRef = useRef(onBusyChange);
  onBusyChangeRef.current = onBusyChange;

  useEffect(() => () => {
    requestVersion.current += 1;
    if (pendingRef.current) onBusyChangeRef.current?.(false);
  }, []);

  const run = async (request, message) => {
    if (pendingRef.current || disabled) return;
    pendingRef.current = true;
    const version = ++requestVersion.current;
    setPending(true);
    setError(null);
    onBusyChange?.(true);
    try {
      const response = await request();
      if (version !== requestVersion.current) return;
      if (response?.data?.order?.orderId) setConvertedOrder(response.data.order.orderId);
      toast.success(message);
      // Business actions return a header, so keep items and reload full details.
      await onChanged();
    } catch (failure) {
      if (version !== requestVersion.current) return;
      setError(failure.response?.data?.message || "Unable to update quotation. Please try again.");
      if ([400, 403, 404, 409].includes(failure.response?.status)) await onChanged();
    } finally {
      if (version === requestVersion.current) {
        pendingRef.current = false;
        setPending(false);
        onBusyChange?.(false);
      }
    }
  };

  const reject = () => {
    const reason = window.prompt("Why is this quotation being rejected?");
    if (reason === null) return;
    if (!reason.trim()) {
      setError("A rejection reason is required");
      return;
    }
    void run(() => rejectQuotationAPI(quotation._id, reason.trim()), "Quotation rejected");
  };

  return (
    <div className="mx-auto mt-5 w-full max-w-[1000px]">
      {error && <p role="alert" className="mb-3 text-sm text-red">{error}</p>}
      <fieldset disabled={disabled || pending} className="flex flex-wrap items-center justify-end gap-3 disabled:opacity-60">
        {actions.submit && <VariantButton variant="cta" size="medium" text={pending ? "Updating…" : "Submit for Approval"}
          icon="send" onClick={() => run(() => submitQuotationAPI(quotation._id), "Quotation submitted")} />}
        {actions.reject && <VariantButton variant="ghostRed" size="medium" text="Reject" icon="x" onClick={reject} />}
        {actions.approve && <VariantButton variant="cta" size="medium" text="Approve" icon="check"
          onClick={() => run(() => approveQuotationAPI(quotation._id), "Quotation approved")} />}
        {actions.convert && <VariantButton variant="cta" size="free" text="Convert to Order" icon="arrow-right"
          className="px-4 py-2" onClick={() => run(() => convertQuotationAPI(quotation._id), "Order created from approved quotation")} />}
        {actions.reopen && <>
          <p className="mr-auto text-sm text-gray-500">Revise this quotation, then return it to draft before submission.</p>
          <VariantButton variant="ghostCta" size="medium" text="Reopen draft"
            onClick={() => run(() => reopenQuotationAPI(quotation._id), "Quotation returned to draft")} />
        </>}
      </fieldset>
      {quotation.status === "APPROVED" && <p className="text-sm text-gray-500">Approved quotation. Saved commercial values are protected and ready for authorized Admin conversion.</p>}
      {convertedOrder && user?.role === "admin" && user.permissions?.includes("ORDER_READ") && <Link className="mt-3 inline-block text-text underline" to={`/admin/orders/${encodeURIComponent(convertedOrder)}`}>Open order {convertedOrder}</Link>}
      {quotation.status === "CONVERTED" && <p className="text-sm text-gray-500">Converted quotations are read-only.</p>}
    </div>
  );
};

export default QuotationWorkflowActions;
