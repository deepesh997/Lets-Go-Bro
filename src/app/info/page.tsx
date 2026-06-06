'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function InfoPage() {
  const [activeForm, setActiveForm] = useState<'order' | 'refund' | 'delivered'>('order');
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    // Order form
    customerName: '',
    email: '',
    phone: '',
    productId: '',
    quantity: '1',
    address: '',
    notes: '',
    // Refund form
    orderId: '',
    refundReason: 'Defective item',
    refundNotes: '',
    // Delivered form
    deliveryCarrier: 'BlueDart',
    trackingNumber: '',
    deliveredDate: '',
    receiverName: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // Attempt background save to Google Sheets (via Google Apps Script API if configured)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      try {
        const url = new URL(apiUrl);
        url.searchParams.set('endpoint', `submit-${activeForm}`);
        await fetch(url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formType: activeForm,
            timestamp: new Date().toISOString(),
            data: formData,
          }),
        });
        console.log(`Form ${activeForm} successfully saved to Google Sheets API.`);
      } catch (err) {
        console.warn('Google Sheets API save failed, falling back to mock save:', err);
      }
    }

    setTimeout(() => {
      setSubmitted(false);
      // Reset form fields
      setFormData({
        customerName: '',
        email: '',
        phone: '',
        productId: '',
        quantity: '1',
        address: '',
        notes: '',
        orderId: '',
        refundReason: 'Defective item',
        refundNotes: '',
        deliveryCarrier: 'BlueDart',
        trackingNumber: '',
        deliveredDate: '',
        receiverName: '',
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-6 overflow-hidden bg-background">
      {/* Premium backdrop blur orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8s]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-tertiary/15 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[10s]" />

      <div className="w-full max-w-2xl z-10 space-y-8">
        {/* Navigation back home (discrete link) */}
        <div className="text-center">
          <Link href="/" className="text-sm text-outline hover:text-primary transition-colors inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">arrow_back</span>
            Return to HubPro
          </Link>
        </div>

        {/* Brand / Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface dark:text-white">
            Information Service Dashboard
          </h1>
          <p className="text-body-md text-on-surface-variant dark:text-surface-variant/80 max-w-md mx-auto">
            Manage your service requests, order details, refunds, and delivery tracking.
          </p>
        </div>

        {/* 3 Forms Tab Selectors */}
        <div className="flex p-1 bg-surface-container dark:bg-inverse-surface/40 rounded-2xl border border-outline-variant/30 backdrop-blur-md animate-fade-in">
          <button
            onClick={() => { setActiveForm('order'); setSubmitted(false); }}
            className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              activeForm === 'order'
                ? 'bg-primary text-on-primary shadow-lg scale-[1.02]'
                : 'text-on-surface-variant dark:text-surface-variant hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-sm">shopping_cart</span>
            Order Form
          </button>
          <button
            onClick={() => { setActiveForm('refund'); setSubmitted(false); }}
            className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              activeForm === 'refund'
                ? 'bg-primary text-on-primary shadow-lg scale-[1.02]'
                : 'text-on-surface-variant dark:text-surface-variant hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-sm">currency_exchange</span>
            Refund Form
          </button>
          <button
            onClick={() => { setActiveForm('delivered'); setSubmitted(false); }}
            className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              activeForm === 'delivered'
                ? 'bg-primary text-on-primary shadow-lg scale-[1.02]'
                : 'text-on-surface-variant dark:text-surface-variant hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-sm">local_shipping</span>
            Delivered Form
          </button>
        </div>

        {/* Form Container */}
        <div className="glass-panel p-8 rounded-2xl border border-white/20 dark:border-white/5 shadow-2xl backdrop-blur-xl relative">
          {submitted ? (
            <div className="py-12 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface dark:text-white">Request Submitted Successfully</h3>
              <p className="text-sm text-on-surface-variant dark:text-surface-variant/80 max-w-sm mx-auto">
                Your submission has been captured. We will process your ticket in the next 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
              {/* ORDER FORM */}
              {activeForm === 'order' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-on-surface dark:text-white border-b border-outline-variant/30 pb-2">
                    Create New Order Request
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-outline uppercase">Customer Name</label>
                      <input
                        type="text"
                        name="customerName"
                        required
                        value={formData.customerName}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="w-full h-11 px-4 bg-white/5 border border-outline-variant dark:border-outline-variant/30 rounded-xl outline-none text-on-surface dark:text-white focus:border-primary transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-outline uppercase">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        className="w-full h-11 px-4 bg-white/5 border border-outline-variant dark:border-outline-variant/30 rounded-xl outline-none text-on-surface dark:text-white focus:border-primary transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-outline uppercase">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 000-0000"
                        className="w-full h-11 px-4 bg-white/5 border border-outline-variant dark:border-outline-variant/30 rounded-xl outline-none text-on-surface dark:text-white focus:border-primary transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-outline uppercase">Product ID / Name</label>
                      <input
                        type="text"
                        name="productId"
                        required
                        value={formData.productId}
                        onChange={handleInputChange}
                        placeholder="e.g. prod_001"
                        className="w-full h-11 px-4 bg-white/5 border border-outline-variant dark:border-outline-variant/30 rounded-xl outline-none text-on-surface dark:text-white focus:border-primary transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-outline uppercase">Quantity</label>
                      <select
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 bg-white/5 border border-outline-variant dark:border-outline-variant/30 rounded-xl outline-none text-on-surface dark:text-white dark:bg-surface-container focus:border-primary transition-all text-sm appearance-none"
                      >
                        {[1, 2, 3, 4, 5].map((q) => (
                          <option key={q} value={q} className="text-on-surface dark:text-white dark:bg-surface-container">
                            {q}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-outline uppercase">Shipping Address</label>
                    <textarea
                      name="address"
                      rows={3}
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Street address, City, State, ZIP code..."
                      className="w-full p-4 bg-white/5 border border-outline-variant dark:border-outline-variant/30 rounded-xl outline-none text-on-surface dark:text-white focus:border-primary transition-all text-sm resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-outline uppercase">Special Delivery Notes</label>
                    <textarea
                      name="notes"
                      rows={2}
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any specific delivery instructions..."
                      className="w-full p-4 bg-white/5 border border-outline-variant dark:border-outline-variant/30 rounded-xl outline-none text-on-surface dark:text-white focus:border-primary transition-all text-sm resize-none"
                    />
                  </div>
                </div>
              )}

              {/* REFUND FORM */}
              {activeForm === 'refund' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-on-surface dark:text-white border-b border-outline-variant/30 pb-2">
                    Request refund
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-outline uppercase">Order ID</label>
                      <input
                        type="text"
                        name="orderId"
                        required
                        value={formData.orderId}
                        onChange={handleInputChange}
                        placeholder="e.g. ord_98765"
                        className="w-full h-11 px-4 bg-white/5 border border-outline-variant dark:border-outline-variant/30 rounded-xl outline-none text-on-surface dark:text-white focus:border-primary transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-outline uppercase">Reason for Refund</label>
                      <select
                        name="refundReason"
                        value={formData.refundReason}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 bg-white/5 border border-outline-variant dark:border-outline-variant/30 rounded-xl outline-none text-on-surface dark:text-white dark:bg-surface-container focus:border-primary transition-all text-sm appearance-none"
                      >
                        <option value="Defective item" className="text-on-surface dark:text-white dark:bg-surface-container">Defective item</option>
                        <option value="Incorrect item received" className="text-on-surface dark:text-white dark:bg-surface-container">Incorrect item received</option>
                        <option value="Late delivery" className="text-on-surface dark:text-white dark:bg-surface-container">Late delivery</option>
                        <option value="Changed my mind" className="text-on-surface dark:text-white dark:bg-surface-container">Changed my mind</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-outline uppercase">Details of Issue</label>
                    <textarea
                      name="refundNotes"
                      rows={4}
                      required
                      value={formData.refundNotes}
                      onChange={handleInputChange}
                      placeholder="Please describe the issue in detail..."
                      className="w-full p-4 bg-white/5 border border-outline-variant dark:border-outline-variant/30 rounded-xl outline-none text-on-surface dark:text-white focus:border-primary transition-all text-sm resize-none"
                    />
                  </div>
                </div>
              )}

              {/* DELIVERED FORM */}
              {activeForm === 'delivered' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-on-surface dark:text-white border-b border-outline-variant/30 pb-2">
                    Log Delivery Confirmation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-outline uppercase">Delivery Carrier</label>
                      <select
                        name="deliveryCarrier"
                        value={formData.deliveryCarrier}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 bg-white/5 border border-outline-variant dark:border-outline-variant/30 rounded-xl outline-none text-on-surface dark:text-white dark:bg-surface-container focus:border-primary transition-all text-sm appearance-none"
                      >
                        <option value="BlueDart" className="text-on-surface dark:text-white dark:bg-surface-container">BlueDart</option>
                        <option value="Delhivery" className="text-on-surface dark:text-white dark:bg-surface-container">Delhivery</option>
                        <option value="DTDC" className="text-on-surface dark:text-white dark:bg-surface-container">DTDC</option>
                        <option value="DHL Express" className="text-on-surface dark:text-white dark:bg-surface-container">DHL Express</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-outline uppercase">Tracking Number</label>
                      <input
                        type="text"
                        name="trackingNumber"
                        required
                        value={formData.trackingNumber}
                        onChange={handleInputChange}
                        placeholder="e.g. AW1298471"
                        className="w-full h-11 px-4 bg-white/5 border border-outline-variant dark:border-outline-variant/30 rounded-xl outline-none text-on-surface dark:text-white focus:border-primary transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-outline uppercase">Delivery Date</label>
                      <input
                        type="date"
                        name="deliveredDate"
                        required
                        value={formData.deliveredDate}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 bg-white/5 border border-outline-variant dark:border-outline-variant/30 rounded-xl outline-none text-on-surface dark:text-white focus:border-primary transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-outline uppercase">Received By (Signature Name)</label>
                      <input
                        type="text"
                        name="receiverName"
                        required
                        value={formData.receiverName}
                        onChange={handleInputChange}
                        placeholder="e.g. Self / Guard"
                        className="w-full h-11 px-4 bg-white/5 border border-outline-variant dark:border-outline-variant/30 rounded-xl outline-none text-on-surface dark:text-white focus:border-primary transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mt-6"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                Submit Request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
