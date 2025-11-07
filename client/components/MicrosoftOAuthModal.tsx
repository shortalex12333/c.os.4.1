import React, { useState } from 'react';
import { 
  Mail, 
  X, 
  Shield, 
  CheckCircle, 
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { UserData } from './LoginScreen';

interface MicrosoftOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (emailConnected: boolean) => void;
  userData: UserData;
  openInNewTab?: boolean; // If true, opens in new tab instead of popup
}

export default function MicrosoftOAuthModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userData,
  openInNewTab = false
}: MicrosoftOAuthModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleSkip = () => {
    console.log('👤 User skipped Microsoft connection');
    onSuccess(false);
    onClose();
  };

  const handleConnectMicrosoft = async () => {
    setIsConnecting(true);
    setError('');

    try {
      console.log('📧 Starting Microsoft OAuth for user:', userData.username);

      // Step 1: Initiate OAuth flow
      const authUrl = `http://localhost:8003/auth/start?user_id=${encodeURIComponent(userData.user_id)}`;
      console.log('🔗 Opening Microsoft OAuth:', authUrl);

      if (openInNewTab) {
        // Open in new tab for later setup
        console.log('🔗 Opening Microsoft OAuth in new tab');
        window.open(authUrl, '_blank');
        
        // Close modal and show success message
        onClose();
        alert('Microsoft OAuth opened in new tab. Complete the process there and return to continue.');
        
        // Poll for completion
        const pollForCompletion = async () => {
          try {
            const statusResponse = await fetch(`http://localhost:8080/api/email/user/${userData.user_id}/status`);
            const statusData = await statusResponse.json();
            
            if (statusData.email_connected) {
              console.log('✅ Microsoft OAuth completed successfully!');
              onSuccess(true);
              return;
            }
          } catch (error) {
            console.error('Status check error:', error);
          }
          
          // Continue polling every 5 seconds for 5 minutes
          setTimeout(pollForCompletion, 5000);
        };
        
        // Start polling after a short delay
        setTimeout(pollForCompletion, 10000);
        
      } else {
        // Open OAuth in popup window (original behavior)
        const popup = window.open(
          authUrl,
          'microsoft_oauth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          throw new Error('Popup blocked - please allow popups for this site');
        }

        // Monitor popup for completion
        const checkPopup = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(checkPopup);
              console.log('🔄 OAuth popup closed, checking for success...');
              handleOAuthComplete();
            }
          } catch (e) {
            // Cross-origin access error is expected until redirect
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          if (!popup.closed) {
            popup.close();
            clearInterval(checkPopup);
            setIsConnecting(false);
            setError('OAuth timeout - please try again');
          }
        }, 300000);
      }

    } catch (error) {
      console.error('❌ Microsoft OAuth error:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnecting(false);
    }
  };

  const handleOAuthComplete = async () => {
    try {
      console.log('🔍 Checking OAuth completion...');
      
      // Wait a moment for OAuth callback to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if user now has Microsoft connection
      const statusUrl = `http://localhost:8080/api/email/user/${userData.user_id}/status`;
      console.log('📡 Checking status at:', statusUrl);
      
      const statusResponse = await fetch(statusUrl);
      console.log('📊 Status response status:', statusResponse.status);
      
      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status} ${statusResponse.statusText}`);
      }
      
      const statusData = await statusResponse.json();
      console.log('📊 User email status after OAuth:', statusData);
      console.log('📊 Email connected:', statusData.email_connected);

      if (statusData.email_connected) {
        console.log('✅ Microsoft OAuth completed successfully!');
        onSuccess(true);
        onClose();
      } else {
        // OAuth may still be processing, let's wait and check again
        console.log('⏳ OAuth still processing, waiting...');
        setTimeout(async () => {
          try {
            const retryResponse = await fetch(`http://localhost:8080/api/email/user/${userData.user_id}/status`);
            const retryData = await retryResponse.json();
            
            if (retryData.email_connected) {
              console.log('✅ Microsoft OAuth completed on retry!');
              onSuccess(true);
              onClose();
            } else {
              console.log('❌ OAuth not completed - user can try again later');
              setError('OAuth not completed - please try again');
              setIsConnecting(false);
            }
          } catch (retryError) {
            console.error('❌ OAuth retry check failed:', retryError);
            setError('Could not verify OAuth completion');
            setIsConnecting(false);
          }
        }, 3000);
      }

    } catch (error) {
      console.error('❌ OAuth completion check failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        userId: userData.user_id,
        statusUrl: `http://localhost:8080/api/email/user/${userData.user_id}/status`
      });
      setError('Could not verify Microsoft connection - check console for details');
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-md">
        <DialogHeader className="relative">
          <button
            onClick={handleSkip}
            className="absolute -top-2 -right-2 text-gray-400 hover:text-white transition-colors"
            disabled={isConnecting}
          >
            <X size={20} />
          </button>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <Mail className="text-blue-400" size={24} />
            Connect Your Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Welcome Message */}
          <div className="text-center">
            <p className="text-gray-300 mb-2">
              Welcome, <span className="text-blue-400 font-medium">{userData.display_name}</span>!
            </p>
            <p className="text-sm text-gray-400">
              Connect your Microsoft email to enable AI-powered email search and assistance.
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-[#2a2a2a] rounded-lg p-4">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              What you'll get:
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                Search your emails using natural language
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                Get email results integrated into chat responses
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                Quick access to relevant correspondence
              </li>
            </ul>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
            <Shield size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-200">
              <p className="font-medium mb-1">Secure Authentication</p>
              <p>Your email access is encrypted and stored securely. You can disconnect anytime.</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isConnecting}
              className="flex-1 text-gray-400 hover:text-white hover:bg-gray-800"
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleConnectMicrosoft}
              disabled={isConnecting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isConnecting ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ExternalLink size={16} />
                  <span>Connect Microsoft</span>
                </div>
              )}
            </Button>
          </div>

          {/* Footer */}
          <p className="text-xs text-center text-gray-500 pt-2">
            You can change this setting later in your profile
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}