import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleClearStorageAndReload = () => {
    try {
      localStorage.removeItem('clinic_studio_proposals_v1');
      localStorage.removeItem('clinic_studio_clinics_v1');
      localStorage.removeItem('clinic_studio_tests_v1');
      localStorage.removeItem('clinic_studio_tiers_v1');
      localStorage.removeItem('clinic_studio_active_id_v1');
    } catch (e) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl m-4 text-center">
          <div className="max-w-md space-y-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {this.props.fallbackTitle || 'เกิดข้อผิดพลาดในการแสดงผล'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {this.state.error?.message || 'ระบบได้ป้องกันหน้าจอขาว คุณสามารถกดโหลดใหม่เพื่อทำงานต่อได้ทันที'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> โหลดข้อมูลใหม่
              </button>
              <button
                onClick={this.handleClearStorageAndReload}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> รีเซ็ตแคชเริ่มต้น
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
