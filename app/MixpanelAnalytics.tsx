"use client";

import { useEffect } from "react";
import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = "2d3cd731bf68ab86ada1102c73372b95";

export function MixpanelAnalytics() {
  useEffect(() => {
    mixpanel.init(MIXPANEL_TOKEN, {
      autocapture: true,
      record_sessions_percent: 100
    });
  }, []);

  return null;
}
