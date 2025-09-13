"use client";

import { useState, useEffect } from "react";
import {
  Palette,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  AlertTriangle,
} from "lucide-react";

interface Style {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at?: string;
}

interface StyleManagementProps {
  adminUserId: string;
}

export function StyleManagement({ adminUserId }: StyleManagementProps) {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStyle, setNewStyle] = useState({ name: "", description: "" });
  const [editStyle, setEditStyle] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchStyles();
  }, []);

  const fetchStyles = async () => {
    try {
      const response = await fetch("/api/admin/styles");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        console.error("Empty response from styles API");
        setStyles([]);
        return;
      }
      
      const data = JSON.parse(text);
      setStyles(data.styles || []);
    } catch (error) {
      console.error("Error fetching styles:", error);
      setStyles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStyle = async () => {
    if (!newStyle.name.trim() || !newStyle.description.trim()) {
      alert("Please fill in both name and description");
      return;
    }

    try {
      const response = await fetch("/api/admin/styles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminUserId,
          name: newStyle.name,
          description: newStyle.description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStyles([...styles, data.style]);
        setNewStyle({ name: "", description: "" });
        setIsCreating(false);
      } else {
        alert(data.error || "Failed to create style");
      }
    } catch (error) {
      console.error("Error creating style:", error);
      alert("Failed to create style");
    }
  };

  const handleUpdateStyle = async (styleId: string) => {
    if (!editStyle.name.trim() || !editStyle.description.trim()) {
      alert("Please fill in both name and description");
      return;
    }

    try {
      const response = await fetch("/api/admin/styles", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminUserId,
          styleId,
          name: editStyle.name,
          description: editStyle.description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStyles(styles.map((s) => (s.id === styleId ? data.style : s)));
        setEditingId(null);
        setEditStyle({ name: "", description: "" });
      } else {
        alert(data.error || "Failed to update style");
      }
    } catch (error) {
      console.error("Error updating style:", error);
      alert("Failed to update style");
    }
  };

  const handleDeleteStyle = async (styleId: string, styleName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the style \"${styleName}\"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/admin/styles", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminUserId,
          styleId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStyles(styles.filter((s) => s.id !== styleId));
      } else {
        alert(data.error || "Failed to delete style");
      }
    } catch (error) {
      console.error("Error deleting style:", error);
      alert("Failed to delete style");
    }
  };

  const startEditing = (style: Style) => {
    setEditingId(style.id);
    setEditStyle({ name: style.name, description: style.description });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditStyle({ name: "", description: "" });
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Palette className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Style Management</h2>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Style</span>
        </button>
      </div>

      {/* Create New Style */}
      {isCreating && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-3">
            Create New Style
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Style name (e.g., Modern, Industrial)"
              value={newStyle.name}
              onChange={(e) =>
                setNewStyle({ ...newStyle, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <textarea
              placeholder="Style description for AI prompts"
              value={newStyle.description}
              onChange={(e) =>
                setNewStyle({ ...newStyle, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleCreateStyle}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Create</span>
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewStyle({ name: "", description: "" });
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles List */}
      <div className="space-y-4">
        {styles.map((style) => (
          <div
            key={style.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-200 transition-colors"
          >
            {editingId === style.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editStyle.name}
                  onChange={(e) =>
                    setEditStyle({ ...editStyle, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <textarea
                  value={editStyle.description}
                  onChange={(e) =>
                    setEditStyle({ ...editStyle, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpdateStyle(style.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
                  >
                    <Save className="h-3 w-3" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400 transition-colors flex items-center space-x-1"
                  >
                    <X className="h-3 w-3" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {style.name}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditing(style)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit style"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStyle(style.id, style.name)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete style"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  {style.description}
                </p>
                <div className="text-xs text-gray-500">
                  Created: {new Date(style.created_at).toLocaleDateString()}
                  {style.updated_at && (
                    <span className="ml-4">
                      Updated: {new Date(style.updated_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {styles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Palette className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No styles created yet. Add your first style to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
