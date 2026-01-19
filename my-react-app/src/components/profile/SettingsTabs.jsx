import React, { useState } from "react";
import { User, Shield } from "lucide-react";
import UserInfo from "./UserInfo";
import PasswordChangeForm from "./PasswordChangeForm";
import useProfileSettings from "../../hooks/useProfileSettings";

const TabBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={[
      "flex h-11 items-center gap-2 rounded-xl px-4 text-sm transition font-medium",
      active
        ? "bg-[#10b981] text-white shadow-sm"
        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
    ].join(" ")}
  >
    {children}
  </button>
);

const SettingsTabs = () => {
  const [activeTab, setActiveTab] = useState("user");
  const { loading, userProfile, saveUserProfile, updatePassword } = useProfileSettings();

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-3">
        <TabBtn active={activeTab === "user"} onClick={() => setActiveTab("user")}>
          <User size={16} /> User Info
        </TabBtn>
        <TabBtn active={activeTab === "password"} onClick={() => setActiveTab("password")}>
          <Shield size={16} /> Password
        </TabBtn>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "user" && (
          <UserInfo
            userProfile={userProfile}
            onSave={saveUserProfile}
            loading={loading}
          />
        )}
        {activeTab === "password" && (
          <PasswordChangeForm
            onSave={updatePassword}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsTabs;