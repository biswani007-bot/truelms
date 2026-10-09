"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FloatingDecorations } from '../../../components/public/floating-decorations';
import { WaveSeparator } from '../../../components/public/wave-separator';

// We import the same CSS used in the Vite version
import "../css/pages/user/BookDemo.css";

const BookDemoPage = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [programOptions, setProgramOptions] = useState<{value: string, label: string}[]>([]);

  // Authenticated Parent check - redirect into authenticated demo journey
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.user?.role === 'parent') {
          window.location.replace('/parent/demo');
        }
      })
    // Fetch dynamic canonical courses
    fetch('/api/public/courses')
      .then(res => res.json())
      .then(data => {
        if (data?.success && data?.data) {
          const opts = data.data.map((c: any) => ({
            value: c.slug,
            label: c.courseName
          }));
          setProgramOptions(opts);
        }
      })
      .catch(() => {});
  }, []);

  // Scroll reveal observer
  useEffect(() => {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 100px 0px' });
    animatedElements.forEach(el => observer.observe(el));
    return () => { animatedElements.forEach(el => observer.unobserve(el)); };
  }, []);
  
  const { register, handleSubmit, trigger, getValues, formState: { errors } } = useForm({
    defaultValues: {
      parentName: '',
      phone: '',
      email: '',
      childName: '',
      childAge: '',
      city: '',
      programInterest: '',
      preferredTime: '',
      mainConcern: '',
      consent: false
    }
  });

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) {
      fieldsToValidate = ['programInterest', 'mainConcern'];
    } else if (step === 2) {
      fieldsToValidate = ['childName', 'childAge'];
    } else if (step === 3) {
      fieldsToValidate = ['preferredTime'];
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/public/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "demo-booking",
          parentName: data.parentName.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
          city: data.city.trim(),
          childName: data.childName.trim(),
          childAge: data.childAge,
          programInterest: data.programInterest,
          courseInterest: data.programInterest,
          preferredTime: data.preferredTime,
          mainConcern: data.mainConcern,
          consent: data.consent,
        }),
      });

      const responseData = await res.json();
      if (!res.ok || !responseData.success) {
        throw new Error(responseData.message || responseData.error || "Failed to schedule free demo. Please try again.");
      }
      setStep(5); // Show confirmation step
    } catch (err: any) {
      console.error('API submission failed:', err);
      setSubmitError(err.message || 'Unable to connect to the booking server. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic program options fetched in useEffect

  const timeOptions = [
    { value: 'Option A: Weekday Evening (After 5 PM)', label: 'Option A: Weekday Evening (After 5 PM)' },
    { value: 'Option B: Weekend Morning (9 AM - 12 PM)', label: 'Option B: Weekend Morning (9 AM - 12 PM)' },
    { value: 'Option C: Weekend Afternoon (12 PM - 4 PM)', label: 'Option C: Weekend Afternoon (12 PM - 4 PM)' },
    { value: 'Option D: Flexible / Any Time', label: 'Option D: Flexible / Any Time' }
  ];

  const concernOptions = [
    { value: 'Low confidence', label: 'Low confidence' },
    { value: 'Communication', label: 'Communication' },
    { value: 'Public speaking', label: 'Public speaking' },
    { value: 'Money awareness', label: 'Money awareness' },
    { value: 'Time management', label: 'Time management' },
    { value: 'AI/future skills', label: 'AI/future skills' },
    { value: 'Emotional control', label: 'Emotional control' },
    { value: 'Other', label: 'Other' }
  ];

  // Helper to handle scrolling to the booking section
  const scrollToForm = () => {
    const el = document.getElementById('booking-wizard-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formData = getValues();

  return (
    <div className="book-demo-page">
      {/* SECTION 1: Hero Section */}
      <section className="demo-hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <FloatingDecorations count={8} />
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="demo-badge">🎁 100% Free Trial</span>
            <h1>Book a free demo class for your child.</h1>
            <p className="hero-subtitle">
              Experience how TrueLern teaches confidence, communication, emotional intelligence, money skills, AI readiness and practical thinking through live online learning.
            </p>
            <div className="hero-ctas">
              <button onClick={scrollToForm} className="btn btn-primary">
                Book Free Demo
              </button>
              <a 
                href="https://wa.me/18001234567" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-secondary btn-whatsapp-hero"
              >
                <span>WhatsApp Us</span>
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-wrapper glass-panel">
              <img 
                src="/img/public/demo_learning.webp" 
                alt="Child attending live online demo class with parent supportive nearby and friendly teacher visible on screen" 
                className="hero-demo-img"
              />
              <div className="live-tag">🔴 Live Demo Session</div>
            </div>
          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-bg)" direction="bottom" />

      {/* SECTION 2: What Happens in the Demo */}
      <section className="demo-explanation">
        <div className="container">
          <div className="explanation-header text-center">
            <span className="section-tag">How It Works</span>
            <h2>What Happens in the Demo</h2>
            <p className="explanation-desc">
              The free demo is not a sales lecture. Your child participates in a short interactive session where we observe confidence, speaking comfort, listening ability, thinking style and engagement. After the demo, we guide the parent toward the most suitable program and level.
            </p>
          </div>

          <div className="timeline-interactive-wrapper">
            <div className="timeline-track-line"></div>
            <div className="timeline-steps-grid">
              
              <div className="timeline-step-card glass-panel animate-on-scroll">
                <div className="step-badge-circle color-teal">Step 1</div>
                <div className="step-icon">👋</div>
                <h4>Warm Welcome</h4>
                <p>Teacher greets the child and makes them comfortable.</p>
                <div className="step-time">⏱️ 5 minutes</div>
              </div>

              <div className="timeline-step-card glass-panel animate-on-scroll">
                <div className="step-badge-circle color-orange">Step 2</div>
                <div className="step-icon">🗣️</div>
                <h4>Speaking Activity</h4>
                <p>Child answers simple questions and shares thoughts.</p>
                <div className="step-time">⏱️ 10 minutes</div>
              </div>

              <div className="timeline-step-card glass-panel animate-on-scroll">
                <div className="step-badge-circle color-violet">Step 3</div>
                <div className="step-icon">🧠</div>
                <h4>Skill Activity</h4>
                <p>Child completes a short confidence, thinking or communication activity.</p>
                <div className="step-time">⏱️ 10 minutes</div>
              </div>

              <div className="timeline-step-card glass-panel animate-on-scroll">
                <div className="step-badge-circle color-blue">Step 4</div>
                <div className="step-icon">👥</div>
                <h4>Parent Explanation</h4>
                <p>Advisor explains the recommended program and next step.</p>
                <div className="step-time">⏱️ 10 minutes</div>
              </div>

              <div className="timeline-step-card glass-panel animate-on-scroll">
                <div className="step-badge-circle color-green">Step 5</div>
                <div className="step-icon">🎓</div>
                <h4>Enrollment Guidance</h4>
                <p>Parent receives pricing, schedule and batch options.</p>
                <div className="step-time">⏱️ 5 minutes</div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-surface-elevated)" direction="bottom" flip={true} />

      {/* SECTION 3: Demo Form (Multi-step Booking Wizard) */}
      <section className="booking-wizard-section" id="booking-wizard-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Cohort Matching</span>
            <h2>Book Your Demo Slot</h2>
            <p className="section-subtitle">Secure your matching group cohort. 100% free with no commitment.</p>
          </div>

          <div className="wizard-card-wrapper glass-panel">
            {/* Step Progress Indicator */}
            {step < 5 && (
              <div className="wizard-progress-container">
                <div className="wizard-progress-bar">
                  <div className="wizard-progress-fill" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
                </div>
                <div className="wizard-steps-indicators">
                  <div className={`step-indicator-node ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                    <span className="node-num">{step > 1 ? '✓' : '1'}</span>
                    <span className="node-label">Program</span>
                  </div>
                  <div className={`step-indicator-node ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                    <span className="node-num">{step > 2 ? '✓' : '2'}</span>
                    <span className="node-label">Child</span>
                  </div>
                  <div className={`step-indicator-node ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                    <span className="node-num">{step > 3 ? '✓' : '3'}</span>
                    <span className="node-label">Schedule</span>
                  </div>
                  <div className={`step-indicator-node ${step >= 4 ? 'active' : ''}`}>
                    <span className="node-num">4</span>
                    <span className="node-label">Parent</span>
                  </div>
                </div>
              </div>
            )}

            {/* Form Wizard Body */}
            {step < 5 ? (
              <form onSubmit={handleSubmit(onSubmit)} className="wizard-form-body">
                
                {/* STEP 1: Program Selection */}
                {step === 1 && (
                  <div className="wizard-step-content slide-in-animation">
                    <div className="step-header">
                      <span className="step-badge-tag">Step 1 of 4</span>
                      <h3>Program Selection</h3>
                      <p>Select the program matching your child's age group and learning priorities.</p>
                    </div>
                    <div className="form-fields-grid">
                      <div className="form-group full-width">
                        <label htmlFor="programInterest">Preferred Program Interest *</label>
                        <select 
                          id="programInterest"
                          className={errors.programInterest ? 'input-error' : ''}
                          {...register("programInterest", { required: "Please select a program" })}
                        >
                          <option value="">Select Preferred Program</option>
                          {programOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        {errors.programInterest && <span className="error-msg">{errors.programInterest.message as string}</span>}
                      </div>

                      <div className="form-group full-width">
                        <label htmlFor="mainConcern">Main Concern for Your Child</label>
                        <select 
                          id="mainConcern"
                          className={errors.mainConcern ? 'input-error' : ''}
                          {...register("mainConcern", { required: "Please select a concern" })}
                        >
                          <option value="">Select Primary Concern</option>
                          {concernOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        {errors.mainConcern && <span className="error-msg">{errors.mainConcern.message as string}</span>}
                      </div>
                    </div>
                    <div className="wizard-navigation">
                      <div className="nav-placeholder"></div>
                      <button type="button" onClick={nextStep} className="btn btn-primary wizard-next-btn">
                        Next: Child Information
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Child Information */}
                {step === 2 && (
                  <div className="wizard-step-content slide-in-animation">
                    <div className="step-header">
                      <span className="step-badge-tag">Step 2 of 4</span>
                      <h3>Child Information</h3>
                      <p>Tell us a bit about your child so we can tailor the cohort setup.</p>
                    </div>
                    <div className="form-fields-grid">
                      <div className="form-group">
                        <label htmlFor="childName">Child Name *</label>
                        <input 
                          type="text" 
                          id="childName"
                          placeholder="e.g. Leo"
                          className={errors.childName ? 'input-error' : ''}
                          {...register("childName", { required: "Child name is required" })}
                        />
                        {errors.childName && <span className="error-msg">{errors.childName.message as string}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="childAge">Child Age *</label>
                        <input 
                          type="number" 
                          id="childAge"
                          placeholder="e.g. 8"
                          className={errors.childAge ? 'input-error' : ''}
                          {...register("childAge", { 
                            required: "Child age is required",
                            min: { value: 6, message: "Ages 6 to 18 only" },
                            max: { value: 18, message: "Ages 6 to 18 only" }
                          })}
                        />
                        {errors.childAge && <span className="error-msg">{errors.childAge.message as string}</span>}
                      </div>
                    </div>
                    <div className="wizard-navigation">
                      <button type="button" onClick={prevStep} className="btn btn-secondary btn-back-nav">
                        Back
                      </button>
                      <button type="button" onClick={nextStep} className="btn btn-primary wizard-next-btn">
                        Next: Demo Schedule
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Demo Schedule */}
                {step === 3 && (
                  <div className="wizard-step-content slide-in-animation">
                    <div className="step-header">
                      <span className="step-badge-tag">Step 3 of 4</span>
                      <h3>Demo Schedule</h3>
                      <p>Select a time option that works best for your household schedule.</p>
                    </div>
                    <div className="form-fields-grid">
                      <div className="form-group full-width">
                        <label htmlFor="preferredTime">Preferred Demo Time *</label>
                        <select 
                          id="preferredTime"
                          className={errors.preferredTime ? 'input-error' : ''}
                          {...register("preferredTime", { required: "Please select a preferred slot" })}
                        >
                          <option value="">Select Preferred Time</option>
                          {timeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        {errors.preferredTime && <span className="error-msg">{errors.preferredTime.message as string}</span>}
                      </div>
                    </div>
                    <div className="wizard-navigation">
                      <button type="button" onClick={prevStep} className="btn btn-secondary btn-back-nav">
                        Back
                      </button>
                      <button type="button" onClick={nextStep} className="btn btn-primary wizard-next-btn">
                        Next: Parent Information
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Parent Information */}
                {step === 4 && (
                  <div className="wizard-step-content slide-in-animation">
                    <div className="step-header">
                      <span className="step-badge-tag">Step 4 of 4</span>
                      <h3>Parent Information</h3>
                      <p>Provide your contact details so we can send you the class link.</p>
                    </div>
                    <div className="form-fields-grid">
                      <div className="form-group">
                        <label htmlFor="parentName">Parent Name *</label>
                        <input 
                          type="text" 
                          id="parentName"
                          placeholder="e.g. Jane Doe"
                          className={errors.parentName ? 'input-error' : ''}
                          {...register("parentName", { required: "Parent name is required" })}
                        />
                        {errors.parentName && <span className="error-msg">{errors.parentName.message as string}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="phone">Phone / WhatsApp Number *</label>
                        <input 
                          type="tel" 
                          id="phone"
                          placeholder="e.g. +1 (555) 019-2834"
                          className={errors.phone ? 'input-error' : ''}
                          {...register("phone", { 
                            required: "Phone number is required",
                            pattern: {
                              value: /^[+]?[0-9\s-()]{7,15}$/,
                              message: "Please enter a valid phone number"
                            }
                          })}
                        />
                        {errors.phone && <span className="error-msg">{errors.phone.message as string}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="email">Email Address *</label>
                        <input 
                          type="email" 
                          id="email"
                          placeholder="e.g. jane@example.com"
                          className={errors.email ? 'input-error' : ''}
                          {...register("email", { 
                            required: "Email address is required",
                            pattern: {
                              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                              message: "Please enter a valid email address"
                            }
                          })}
                        />
                        {errors.email && <span className="error-msg">{errors.email.message as string}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="city">Country / City *</label>
                        <input 
                          type="text" 
                          id="city"
                          placeholder="e.g. United States, Chicago"
                          className={errors.city ? 'input-error' : ''}
                          {...register("city", { required: "Country / City is required" })}
                        />
                        {errors.city && <span className="error-msg">{errors.city.message as string}</span>}
                      </div>

                      <div className="form-group full-width consent-group">
                        <div className="checkbox-wrapper">
                          <input 
                            type="checkbox" 
                            id="consent"
                            className={errors.consent ? 'input-error' : ''}
                            {...register("consent", { required: "Consent is required" })}
                          />
                          <label htmlFor="consent" className="checkbox-label">
                            I agree to be contacted by TrueLern through phone, email or WhatsApp regarding the demo class.
                          </label>
                        </div>
                        {errors.consent && <span className="error-msg block">{errors.consent.message as string}</span>}
                      </div>
                    </div>

                    {submitError && (
                      <div className="form-submit-error-banner">
                        ⚠️ {submitError}
                      </div>
                    )}

                    <div className="wizard-navigation">
                      <button type="button" onClick={prevStep} className="btn btn-secondary btn-back-nav" disabled={isLoading}>
                        Back
                      </button>
                      <button type="submit" className="btn btn-primary wizard-submit-btn" disabled={isLoading}>
                        {isLoading ? 'Booking Slot...' : 'Book Free Demo'}
                      </button>
                    </div>
                  </div>
                )}

              </form>
            ) : (
              /* SECTION 4: Confirmation Message & SECTION 5: WhatsApp Follow-Up preview */
              <div className="wizard-success-state slide-in-animation text-center">
                <div className="success-lottie-mock">
                  <div className="checkmark-circle">
                    <div className="checkmark-draw"></div>
                  </div>
                </div>
                
                {/* SECTION 4: Confirmation Message */}
                <h3 className="success-title">Booking Confirmed!</h3>
                <p className="success-message-text">
                  Thank you for booking a free demo with TrueLern. Our team will contact you shortly to confirm the schedule and share the class link. Please keep your child ready in a quiet space with a laptop or tablet, working internet and a notebook.
                </p>

                {/* SECTION 5: WhatsApp Follow-Up preview */}
                <div className="whatsapp-preview-card">
                  <div className="wa-card-header">
                    <div className="wa-profile-pic">💬</div>
                    <div className="wa-profile-details">
                      <span className="wa-profile-name">TrueLern Assistant</span>
                      <span className="wa-profile-status">online</span>
                    </div>
                  </div>
                  <div className="wa-card-body">
                    <div className="wa-message-bubble">
                      <p>
                        Hi {formData.parentName || '[Parent Name]'}, thank you for booking a free demo with TrueLern. We help children build confidence, communication, money skills, AI readiness and practical thinking through live online classes. Please confirm your preferred demo time: {formData.preferredTime || '[Option 1], [Option 2], or [Option 3]'}.
                      </p>
                      <span className="wa-message-time">Just now ✓✓</span>
                    </div>
                  </div>
                  <div className="wa-card-footer-tip">
                    <span>📱 You will receive a WhatsApp message similar to the preview above shortly.</span>
                  </div>
                </div>

                <div className="success-action-buttons">
                  <button 
                    onClick={() => {
                      setStep(1);
                      setSubmitError(null);
                    }} 
                    className="btn btn-secondary"
                  >
                    Book Another Slot
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-bg)" direction="bottom" />

      {/* Trust Badges / Stats Strip */}
      <section className="demo-trust-badges">
        <div className="container trust-badges-grid">
          <div className="badge-item glass-panel">
            <span className="badge-emoji">🌟</span>
            <h3>4.9/5 Rating</h3>
            <p>Loved by 10,000+ parents worldwide</p>
          </div>
          <div className="badge-item glass-panel">
            <span className="badge-emoji">👥</span>
            <h3>Max 5 Kids</h3>
            <p>Small matching cohort groups</p>
          </div>
          <div className="badge-item glass-panel">
            <span className="badge-emoji">🧠</span>
            <h3>Expert Coaches</h3>
            <p>Trained child development specialists</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookDemoPage;
