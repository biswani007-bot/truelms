"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  RefreshCw,
  Shield,
  Radio,
  Users,
  PhoneOff,
  Loader2,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Settings,
  Sparkles,
  ArrowRight,
  LogOut,
  PowerOff
} from "lucide-react";

interface JitsiMeetRoomProps {
  roomName: string;
  jwtToken?: string;
  jwt?: string;
  jitsiDomain?: string;
  serverUrl?: string;
  isModerator?: boolean;
  userName?: string;
  userInfo?: {
    displayName?: string;
    email?: string;
  };
  classTitle?: string;
  liveClassId?: string;
  studentId?: string;
  onConferenceLeft?: string | (() => void);
  onReadyToClose?: () => void;
  configOverwrite?: Record<string, any>;
  interfaceConfigOverwrite?: Record<string, any>;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export function JitsiMeetRoom({
  roomName,
  jwtToken,
  jwt,
  jitsiDomain,
  serverUrl,
  isModerator = false,
  userName,
  userInfo,
  classTitle = "Live Session",
  liveClassId,
  studentId,
  onConferenceLeft,
  onReadyToClose,
  configOverwrite: customConfigOverwrite,
  interfaceConfigOverwrite: customInterfaceConfigOverwrite,
}: JitsiMeetRoomProps) {
  const router = useRouter();

  // Normalize prop values
  const effectiveJwt = jwtToken || jwt || "";
  const effectiveUserName = userName || userInfo?.displayName || "Participant";
  const effectiveDomain =
    jitsiDomain ||
    (typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_JITSI_DOMAIN || "localhost:8443")
      : "localhost:8443");
  const effectiveServerUrl =
    serverUrl ||
    (typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_JITSI_SERVER_URL || `https://${effectiveDomain}`)
      : `https://${effectiveDomain}`);

  // Pre-join States
  const [hasJoined, setHasJoined] = useState(false);
  const [micEnabled, setMicEnabled] = useState(!isModerator ? false : true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [availableAudioDevices, setAvailableAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [availableVideoDevices, setAvailableVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<"pending" | "granted" | "denied">("pending");

  // In-Call States
  const containerRef = useRef<HTMLDivElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const jitsiApiRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "ready" | "connected" | "disconnected">("connecting");

  const performRedirect = () => {
    if (typeof onConferenceLeft === "string") {
      router.push(onConferenceLeft);
    } else if (typeof onConferenceLeft === "function") {
      onConferenceLeft();
    } else if (typeof onReadyToClose === "function") {
      onReadyToClose();
    } else {
      router.push(isModerator ? "/teacher/live-classes" : "/student/live-classes");
    }
  };

  // -------------------------------------------------------------
  // PRE-JOIN MEDIA SETUP & PREVIEW STREAM
  // -------------------------------------------------------------
  useEffect(() => {
    if (hasJoined) return;

    let isMounted = true;

    async function initPreviewStream() {
      try {
        setPermissionState("pending");
        setPreviewError(null);

        // Request initial user media
        const constraints: MediaStreamConstraints = {
          audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
          video: selectedVideoDevice
            ? { deviceId: { exact: selectedVideoDevice }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 } },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        // Clean up any existing stream
        if (previewStreamRef.current) {
          previewStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        previewStreamRef.current = stream;
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }

        // Apply toggles
        stream.getAudioTracks().forEach((track) => {
          track.enabled = micEnabled;
        });
        stream.getVideoTracks().forEach((track) => {
          track.enabled = camEnabled;
        });

        setPermissionState("granted");

        // Enumerate devices to populate selection lists
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          if (isMounted) {
            const audioInputs = devices.filter((d) => d.kind === "audioinput");
            const videoInputs = devices.filter((d) => d.kind === "videoinput");
            setAvailableAudioDevices(audioInputs);
            setAvailableVideoDevices(videoInputs);

            if (!selectedAudioDevice && audioInputs.length > 0) {
              const currentAudioTrack = stream.getAudioTracks()[0];
              const currentAudioId = currentAudioTrack?.getSettings()?.deviceId || audioInputs[0].deviceId;
              setSelectedAudioDevice(currentAudioId);
            }
            if (!selectedVideoDevice && videoInputs.length > 0) {
              const currentVideoTrack = stream.getVideoTracks()[0];
              const currentVideoId = currentVideoTrack?.getSettings()?.deviceId || videoInputs[0].deviceId;
              setSelectedVideoDevice(currentVideoId);
            }
          }
        } catch {
          // ignore enumeration failure
        }
      } catch (err: any) {
        if (!isMounted) return;
        setPermissionState("denied");
        setPreviewError(
          err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            ? "Camera/Microphone permissions were blocked. You can still join with media muted or grant browser permissions."
            : `Unable to access media hardware: ${err.message || "Device unavailable"}`
        );
      }
    }

    if (typeof navigator !== "undefined" && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function") {
      initPreviewStream();
    } else {
      setPermissionState("denied");
      setPreviewError("Your browser does not support media device preview.");
    }

    return () => {
      isMounted = false;
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((t) => t.stop());
        previewStreamRef.current = null;
      }
    };
  }, [hasJoined, selectedAudioDevice, selectedVideoDevice]);

  // Sync mic track enabled state with toggle button
  const toggleMic = () => {
    const nextState = !micEnabled;
    setMicEnabled(nextState);
    if (previewStreamRef.current) {
      previewStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = nextState;
      });
    }
  };

  // Sync cam track enabled state with toggle button
  const toggleCam = () => {
    const nextState = !camEnabled;
    setCamEnabled(nextState);
    if (previewStreamRef.current) {
      previewStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = nextState;
      });
    }
  };

  // Stop preview tracks & enter Jitsi session
  const handleJoinClassroom = () => {
    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach((t) => t.stop());
      previewStreamRef.current = null;
    }
    setHasJoined(true);
  };

  // -------------------------------------------------------------
  // JITSI ENGINE INITIALIZATION (ONLY AFTER USER CLICKS JOIN)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!hasJoined) return;

    let scriptElement: HTMLScriptElement | null = null;
    let isMounted = true;
    let fallbackTimer: NodeJS.Timeout | null = null;

    async function loadJitsiScript() {
      try {
        setLoading(true);
        setError(null);

        // Check if script is already loaded
        if (window.JitsiMeetExternalAPI) {
          initializeJitsi();
          return;
        }

        // Clean host domain for external_api.js
        const scriptUrl = `${effectiveServerUrl.replace(/\/+$/, "")}/external_api.js`;

        // Inject script tag
        scriptElement = document.createElement("script");
        scriptElement.src = scriptUrl;
        scriptElement.async = true;

        scriptElement.onload = () => {
          if (isMounted) initializeJitsi();
        };

        scriptElement.onerror = () => {
          if (isMounted) {
            setLoading(false);
            setError(
              `Self-hosted Jitsi service at ${effectiveDomain} is unreachable. Please verify that the local Jitsi Docker instance is running on ${effectiveServerUrl}.`
            );
          }
        };

        document.body.appendChild(scriptElement);
      } catch (err: any) {
        if (isMounted) {
          setLoading(false);
          setError(err.message || "Failed to load classroom video engine.");
        }
      }
    }

    function initializeJitsi() {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

      try {
        // Clear previous instances
        if (jitsiApiRef.current) {
          try {
            jitsiApiRef.current.dispose();
          } catch {
            // ignore
          }
        }

        const domainOnly = effectiveDomain.replace(/^https?:\/\//, "");

        // Determine toolbar buttons based on role
        const defaultToolbarButtons = isModerator
          ? [
              "camera",
              "chat",
              "closedcaptions",
              "desktop",
              "fullscreen",
              "fodeviceselection",
              "hangup",
              "microphone",
              "mute-everyone",
              "participants-pane",
              "profile",
              "raisehand",
              "recording",
              "settings",
              "tileview",
              "toggle-camera",
              "videoquality",
              "whiteboard",
            ]
          : [
              "camera",
              "chat",
              "closedcaptions",
              "desktop",
              "fullscreen",
              "fodeviceselection",
              "hangup",
              "microphone",
              "participants-pane",
              "profile",
              "raisehand",
              "settings",
              "tileview",
              "toggle-camera",
              "videoquality",
            ];

        const options = {
          roomName,
          jwt: effectiveJwt,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          configOverwrite: {
            startWithAudioMuted: !micEnabled,
            startWithVideoMuted: !camEnabled,
            prejoinPageEnabled: false,
            prejoinConfig: {
              enabled: false,
              hideDisplayName: true,
            },
            disableDeepLinking: true,
            disableThirdPartyRequests: true,
            defaultLogoUrl: "",
            dynamicBrandingUrl: "",
            enableRecording: isModerator,
            fileRecordingsEnabled: isModerator,
            liveStreamingEnabled: false,
            defaultRemoteDisplayName: "Cohort Scholar",
            hideConferenceSubject: false,
            hideConferenceTimer: false,
            toolbarButtons: defaultToolbarButtons,
            ...customConfigOverwrite,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: "",
            DEFAULT_LOGO_URL: "",
            DEFAULT_WELCOME_PAGE_LOGO_URL: "",
            SHOW_POWERED_BY: false,
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            APP_NAME: "TrueLern Live Classroom",
            NATIVE_APP_NAME: "TrueLern",
            PROVIDER_NAME: "TrueLern Enterprise Education",
            DEFAULT_REMOTE_DISPLAY_NAME: "Cohort Scholar",
            DEFAULT_LOCAL_DISPLAY_NAME: "me",
            DISABLE_VIDEO_BACKGROUND: true,
            HIDE_INVITE_MORE_HEADER: true,
            MOBILE_APP_PROMO: false,
            SHOW_CHROME_EXTENSION_BANNER: false,
            ...customInterfaceConfigOverwrite,
          },
          userInfo: {
            displayName: effectiveUserName,
          },
        };

        const api = new window.JitsiMeetExternalAPI(domainOnly, options);
        jitsiApiRef.current = api;

        // Ensure the generated iframe has complete media permissions allowed
        const iframe = api.getIFrame ? api.getIFrame() : containerRef.current.querySelector("iframe");
        if (iframe) {
          iframe.setAttribute(
            "allow",
            "camera *; microphone *; display-capture *; autoplay *; clipboard-write *; encrypted-media *; fullscreen *"
          );
          iframe.addEventListener("load", () => {
            if (isMounted) {
              setLoading(false);
              setConnectionStatus("ready");
            }
          });
        }

        // Safety fallback: Clear loader after max 2.5s once API instance is alive
        fallbackTimer = setTimeout(() => {
          if (isMounted) {
            setLoading(false);
          }
        }, 2500);

        let heartbeatTimer: NodeJS.Timeout | null = null;

        api.addEventListener("videoConferenceJoined", () => {
          if (isMounted) {
            setLoading(false);
            setConnectionStatus("connected");
            try {
              const count = api.getNumberOfParticipants ? api.getNumberOfParticipants() : 1;
              setParticipantCount(count || 1);
            } catch {
              // ignore
            }

            // Trigger authoritative participation join event
            if (liveClassId) {
              fetch(`/api/live-classes/${liveClassId}/participation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  event: "joined",
                  studentId,
                }),
              }).catch(() => {});

              if (heartbeatTimer) clearInterval(heartbeatTimer);
              heartbeatTimer = setInterval(() => {
                if (!isMounted) return;
                fetch(`/api/live-classes/${liveClassId}/participation`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    event: "heartbeat",
                    studentId,
                    durationSeconds: 30,
                  }),
                }).catch(() => {});
              }, 30000);
            }
          }
        });

        api.addEventListener("participantJoined", () => {
          if (isMounted) {
            try {
              const count = api.getNumberOfParticipants ? api.getNumberOfParticipants() : participantCount + 1;
              setParticipantCount(count || participantCount + 1);
            } catch {
              setParticipantCount((prev) => prev + 1);
            }
          }
        });

        api.addEventListener("participantLeft", () => {
          if (isMounted) {
            try {
              const count = api.getNumberOfParticipants ? api.getNumberOfParticipants() : Math.max(1, participantCount - 1);
              setParticipantCount(count || Math.max(1, participantCount - 1));
            } catch {
              setParticipantCount((prev) => Math.max(1, prev - 1));
            }
          }
        });

        api.addEventListener("recordingStatusChanged", async (status: any) => {
          if (isMounted) {
            const isNowRecording = status.on === true;
            setIsRecording(isNowRecording);

            // When recording is stopped by moderator, automatically notify backend
            if (!isNowRecording && isModerator && liveClassId) {
              try {
                await fetch(`/api/live-classes/${liveClassId}/recordings`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    recordingUrl: `file://${roomName}.mp4`,
                    status: "processing",
                  }),
                });
              } catch {
                // Non-blocking notification
              }
            }
          }
        });

        api.addEventListener("videoConferenceLeft", () => {
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }
          if (liveClassId) {
            fetch(`/api/live-classes/${liveClassId}/participation`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                event: "left",
                studentId,
              }),
              keepalive: true,
            }).catch(() => {});
          }
          if (isMounted) {
            setConnectionStatus("disconnected");
            performRedirect();
          }
        });

        api.addEventListener("readyToClose", () => {
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }
          if (isMounted) {
            setConnectionStatus("disconnected");
            performRedirect();
          }
        });
      } catch (err: any) {
        if (isMounted) {
          setLoading(false);
          setError(err.message || "Failed to initialize classroom room container.");
        }
      }
    }

    loadJitsiScript();

    return () => {
      isMounted = false;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch {
          // ignore cleanup errors
        }
      }
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
    };
  }, [hasJoined, roomName, effectiveJwt, effectiveDomain, effectiveServerUrl, isModerator, effectiveUserName]);

  // Leave Conference (Participant)
  function handleLeaveSession() {
    if (isLeaving) return;
    setIsLeaving(true);

    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.executeCommand("hangup");
      } catch {
        // ignore
      }

      setTimeout(() => {
        if (jitsiApiRef.current) {
          try {
            jitsiApiRef.current.dispose();
          } catch {
            // ignore
          }
        }
        performRedirect();
      }, 800);
    } else {
      performRedirect();
    }
  }

  // End Conference for All (Moderator Only)
  function handleEndMeetingForAll() {
    if (isLeaving || !isModerator) return;
    const confirmEnd = window.confirm("Are you sure you want to end this live session for all participants?");
    if (!confirmEnd) return;

    setIsLeaving(true);

    if (jitsiApiRef.current) {
      try {
        // Mute everyone and hangup
        jitsiApiRef.current.executeCommand("muteEveryone");
        jitsiApiRef.current.executeCommand("hangup");
      } catch {
        // ignore
      }

      // Mark lecture as completed if liveClassId provided
      if (liveClassId) {
        fetch(`/api/live-classes/${liveClassId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        }).catch(() => {});
      }

      setTimeout(() => {
        if (jitsiApiRef.current) {
          try {
            jitsiApiRef.current.dispose();
          } catch {
            // ignore
          }
        }
        performRedirect();
      }, 1000);
    } else {
      performRedirect();
    }
  }

  function handleToggleRecording() {
    if (jitsiApiRef.current && isModerator) {
      if (isRecording) {
        jitsiApiRef.current.executeCommand("stopRecording", "file");
      } else {
        jitsiApiRef.current.executeCommand("startRecording", {
          mode: "file",
        });
      }
    }
  }

  // =========================================================================
  // VIEW 1: GOOGLE-MEET STYLE PRE-JOIN LOBBY
  // =========================================================================
  if (!hasJoined) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] w-full bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
        {/* Pre-Join Top Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">{classTitle}</h2>
              <p className="text-[11px] text-slate-400">Classroom Lobby • Audio & Video Setup</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                isModerator
                  ? "bg-indigo-950/80 text-indigo-300 border-indigo-700/60"
                  : "bg-slate-800 text-slate-300 border-slate-700/60"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              {isModerator ? "Instructor (Moderator)" : "Verified Participant"}
            </span>
          </div>
        </div>

        {/* Pre-Join Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 md:p-12 gap-8 lg:gap-14 overflow-y-auto">
          {/* Left Column: Live Camera Preview & Media Controls */}
          <div className="flex flex-col items-center w-full max-w-xl">
            <div className="relative w-full aspect-video bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl flex items-center justify-center group">
              {/* Local Video Stream Element */}
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  !camEnabled || permissionState === "denied" ? "hidden" : "block"
                }`}
              />

              {/* Video Off / Permission Denied Fallback */}
              {(!camEnabled || permissionState === "denied") && (
                <div className="flex flex-col items-center justify-center gap-3 text-center p-6">
                  <div className="w-20 h-20 rounded-full bg-slate-800/90 border border-slate-700 flex items-center justify-center text-slate-400 shadow-inner">
                    <VideoOff className="w-9 h-9" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Camera is turned off</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {permissionState === "denied"
                        ? "Browser permission is needed for live camera preview"
                        : "Turn on camera below to preview your feed before joining"}
                    </p>
                  </div>
                </div>
              )}

              {/* User Identity Watermark Pill */}
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-slate-950/70 backdrop-blur-md rounded-xl border border-slate-800/80 text-xs font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{effectiveUserName}</span>
              </div>

              {/* Floating Bottom Media Bar on Preview */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 z-10">
                {/* Microphone Toggle Button */}
                <button
                  type="button"
                  id="prejoin-toggle-mic-btn"
                  onClick={toggleMic}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${
                    micEnabled
                      ? "bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-600/60"
                      : "bg-red-600 hover:bg-red-500 text-white border border-red-400"
                  }`}
                  title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
                >
                  {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                {/* Camera Toggle Button */}
                <button
                  type="button"
                  id="prejoin-toggle-cam-btn"
                  onClick={toggleCam}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${
                    camEnabled
                      ? "bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-600/60"
                      : "bg-red-600 hover:bg-red-500 text-white border border-red-400"
                  }`}
                  title={camEnabled ? "Turn off Camera" : "Turn on Camera"}
                >
                  {camEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Hardware Selectors (Mic / Camera Device Pickers) */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
                <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Mic className="w-3.5 h-3.5 text-indigo-400" />
                  Microphone Source
                </label>
                <select
                  value={selectedAudioDevice}
                  onChange={(e) => setSelectedAudioDevice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 transition"
                >
                  {availableAudioDevices.length === 0 ? (
                    <option value="">Default Microphone</option>
                  ) : (
                    availableAudioDevices.map((d, idx) => (
                      <option key={d.deviceId || idx} value={d.deviceId}>
                        {d.label || `Microphone ${idx + 1}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
                <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <VideoIcon className="w-3.5 h-3.5 text-indigo-400" />
                  Camera Source
                </label>
                <select
                  value={selectedVideoDevice}
                  onChange={(e) => setSelectedVideoDevice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 transition"
                >
                  {availableVideoDevices.length === 0 ? (
                    <option value="">Default Camera</option>
                  ) : (
                    availableVideoDevices.map((d, idx) => (
                      <option key={d.deviceId || idx} value={d.deviceId}>
                        {d.label || `Camera ${idx + 1}`}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {previewError && (
              <p className="text-xs text-amber-400/90 bg-amber-950/30 border border-amber-900/50 rounded-xl px-3 py-2 mt-3 w-full text-center">
                {previewError}
              </p>
            )}
          </div>

          {/* Right Column: User Ready Card & "Join Classroom" CTA */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-md w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ready for Live Instruction</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Ready to enter your classroom?
            </h1>

            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Your audio and video settings are configured. No remote participants can hear or see you until you click
              Join.
            </p>

            {/* Profile summary card */}
            <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mt-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-md">
                  {effectiveUserName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{effectiveUserName}</h4>
                  <p className="text-xs text-slate-400">
                    {isModerator ? "Classroom Instructor (Moderator)" : "Verified Student / Participant"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                  {roomName}
                </span>
              </div>
            </div>

            {/* Join CTA Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-6">
              <button
                type="button"
                id="join-classroom-btn"
                onClick={handleJoinClassroom}
                className="w-full sm:flex-1 py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition transform active:scale-[0.98]"
              >
                <span>Join Classroom</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={performRedirect}
                className="w-full sm:w-auto py-3.5 px-5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl text-sm font-semibold border border-slate-800 transition"
              >
                Cancel
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mt-4">
              Joined with microphone {micEnabled ? "active" : "muted"} and camera {camEnabled ? "on" : "off"}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE JITSI LIVE CLASSROOM SESSION
  // =========================================================================
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] w-full bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
      {/* Top Classroom Control Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">{classTitle}</h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Room: {roomName}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-indigo-400" />
                {isModerator ? "Instructor (Moderator)" : "Participant (Member)"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-xs font-bold animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>RECORDING</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full text-slate-300 text-xs font-semibold">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{participantCount} In Session</span>
          </div>

          {/* Moderator Recording Controls */}
          {isModerator && !isRecording && (
            <button
              onClick={handleToggleRecording}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Start Recording
            </button>
          )}

          {isModerator && isRecording && (
            <button
              onClick={handleToggleRecording}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Stop Recording
            </button>
          )}

          {/* Leave Session Button (Both Instructor and Students can leave) */}
          <button
            onClick={handleLeaveSession}
            disabled={isLeaving}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-white rounded-xl text-xs font-bold transition shadow-sm ${
              isLeaving
                ? "bg-slate-700 cursor-not-allowed opacity-80"
                : "bg-slate-800 hover:bg-slate-700 border border-slate-700"
            }`}
            title="Leave classroom session"
          >
            {isLeaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>{isLeaving ? "Leaving..." : "Leave"}</span>
          </button>

          {/* End Meeting For All Button (STRICTLY MODERATOR ONLY) */}
          {isModerator && (
            <button
              onClick={handleEndMeetingForAll}
              disabled={isLeaving}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-white rounded-xl text-xs font-bold transition shadow-sm ${
                isLeaving
                  ? "bg-slate-700 cursor-not-allowed opacity-80"
                  : "bg-red-600 hover:bg-red-700 shadow-red-600/20"
              }`}
              title="End lecture session for all participants"
            >
              {isLeaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <PowerOff className="w-3.5 h-3.5" />
              )}
              <span>End Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="flex-1 w-full h-full relative bg-slate-950">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-20 gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-300">Connecting to secure classroom session...</p>
            <p className="text-xs text-slate-500">Verifying JWT affiliation and establishing encrypted media bridge</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-20 p-8 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Live Classroom Connection Notice</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{error}</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
              >
                Retry Connection
              </button>
              {onConferenceLeft && (
                <button
                  onClick={performRedirect}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Return to Dashboard
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
