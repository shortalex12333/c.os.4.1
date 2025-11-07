import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// Import all UX components
import EmailCardCollapsedLight from './ux/EmailCardCollapsedLight';
import EmailCardCollapsedDark from './ux/EmailCardCollapsedDark';
import EmailCardExpandedLight from './ux/EmailCardExpandedLight';
import EmailCardExpandedDark from './ux/EmailCardExpandedDark';
import EmailCardWithAttachmentsLight from './ux/EmailCardWithAttachmentsLight';
import EmailCardWithAttachmentsDark from './ux/EmailCardWithAttachmentsDark';

import NASCardCollapsedLight from './ux/NASCardCollapsedLight';
import NASCardCollapsedDark from './ux/NASCardCollapsedDark';
import NASCardExpandedLight from './ux/NASCardExpandedLight';
import NASCardExpandedDark from './ux/NASCardExpandedDark';
import NASCardExpandedWithFilesLight from './ux/NASCardExpandedWithFilesLight';
import NASCardExpandedWithFilesDark from './ux/NASCardExpandedWithFilesDark';

import AIResponseCardLight from './ux/AIResponseCardLight';
import AIResponseCardDark from './ux/AIResponseCardDark';

export type CardType = 'email' | 'nas' | 'ai-response';
export type CardState = 'collapsed' | 'expanded' | 'with-attachments' | 'with-files';

interface CascadeCardProps {
  type: CardType;
  data: {
    // Common fields
    title: string;

    // Email specific
    senderName?: string;
    senderEmail?: string;
    date?: string;
    subject?: string;
    content?: string;
    summary?: string;
    attachments?: Array<{
      id: string;
      fileName: string;
      fileSize: string;
      icon: string;
    }>;

    // NAS specific
    source?: string;
    errorCode?: string;
    description?: string;
    diagnostics?: string[];
    partsList?: string[];
    files?: Array<{
      id: string;
      fileName: string;
      source: string;
    }>;

    // AI Response specific
    answer?: string;
    sources?: Array<{
      doc_name: string;
      page?: number;
      relevance?: string;
    }>;
    modelUsed?: string;
    reasoning?: string;
  };
  onClose?: () => void;
  onAskAI?: () => void;
  onHelpful?: () => void;
  onNotHelpful?: () => void;
}

export default function CascadeCard({ type, data, onClose, onAskAI, onHelpful, onNotHelpful }: CascadeCardProps) {
  const { theme } = useTheme();
  const [cardState, setCardState] = useState<CardState>('collapsed');
  
  // Handle progressive expansion
  const handleExpand = () => {
    if (cardState === 'collapsed') {
      setCardState('expanded');
    }
  };
  
  const handleAttachmentsClick = () => {
    if (cardState === 'expanded' && type === 'email') {
      setCardState('with-attachments');
    }
  };
  
  const handleFilesClick = () => {
    if (cardState === 'expanded' && type === 'nas') {
      setCardState('with-files');
    }
  };
  
  const handleCollapse = () => {
    setCardState('collapsed');
  };
  
  // Render appropriate component based on type, theme, and state
  const renderCard = () => {
    if (type === 'email') {
      // Email card cascade
      if (cardState === 'collapsed') {
        return theme === 'light' ? (
          <EmailCardCollapsedLight
            title={data.title}
            senderName={data.senderName}
            senderEmail={data.senderEmail}
            date={data.date}
            subject={data.subject}
            onExpand={handleExpand}
            onClose={onClose}
          />
        ) : (
          <EmailCardCollapsedDark
            title={data.title}
            senderName={data.senderName}
            senderEmail={data.senderEmail}
            date={data.date}
            subject={data.subject}
            onExpand={handleExpand}
            onClose={onClose}
          />
        );
      } else if (cardState === 'expanded') {
        return theme === 'light' ? (
          <EmailCardExpandedLight
            title={data.title}
            senderName={data.senderName}
            senderEmail={data.senderEmail}
            date={data.date}
            subject={data.subject}
            content={data.content}
            summary={data.summary}
            hasAttachments={data.attachments && data.attachments.length > 0}
            onCollapse={handleCollapse}
            onClose={onClose}
            onAttachmentsClick={handleAttachmentsClick}
          />
        ) : (
          <EmailCardExpandedDark
            title={data.title}
            senderName={data.senderName}
            senderEmail={data.senderEmail}
            date={data.date}
            subject={data.subject}
            content={data.content}
            summary={data.summary}
            hasAttachments={data.attachments && data.attachments.length > 0}
            onCollapse={handleCollapse}
            onClose={onClose}
            onAttachmentsClick={handleAttachmentsClick}
          />
        );
      } else if (cardState === 'with-attachments') {
        return theme === 'light' ? (
          <EmailCardWithAttachmentsLight
            title={data.title}
            senderName={data.senderName}
            senderEmail={data.senderEmail}
            date={data.date}
            subject={data.subject}
            content={data.content}
            summary={data.summary}
            attachments={data.attachments || []}
            onCollapse={handleCollapse}
            onClose={onClose}
          />
        ) : (
          <EmailCardWithAttachmentsDark
            title={data.title}
            senderName={data.senderName}
            senderEmail={data.senderEmail}
            date={data.date}
            subject={data.subject}
            content={data.content}
            summary={data.summary}
            attachments={data.attachments || []}
            onCollapse={handleCollapse}
            onClose={onClose}
          />
        );
      }
    } else if (type === 'nas') {
      // NAS card cascade
      if (cardState === 'collapsed') {
        return theme === 'light' ? (
          <NASCardCollapsedLight
            title={data.title}
            source={data.source}
            onExpand={handleExpand}
            onClose={onClose}
            onSourceDropdown={handleFilesClick}
          />
        ) : (
          <NASCardCollapsedDark
            title={data.title}
            source={data.source}
            onExpand={handleExpand}
            onClose={onClose}
            onSourceDropdown={handleFilesClick}
          />
        );
      } else if (cardState === 'expanded') {
        return theme === 'light' ? (
          <NASCardExpandedLight
            title={data.title}
            errorCode={data.errorCode}
            description={data.description}
            diagnostics={data.diagnostics || []}
            partsList={data.partsList || []}
            source={data.source}
            hasFiles={data.files && data.files.length > 0}
            onCollapse={handleCollapse}
            onClose={onClose}
            onFilesClick={handleFilesClick}
            onAskAI={onAskAI}
            onHelpful={onHelpful}
            onNotHelpful={onNotHelpful}
          />
        ) : (
          <NASCardExpandedDark
            title={data.title}
            errorCode={data.errorCode}
            description={data.description}
            diagnostics={data.diagnostics || []}
            partsList={data.partsList || []}
            source={data.source}
            hasFiles={data.files && data.files.length > 0}
            onCollapse={handleCollapse}
            onClose={onClose}
            onFilesClick={handleFilesClick}
            onAskAI={onAskAI}
            onHelpful={onHelpful}
            onNotHelpful={onNotHelpful}
          />
        );
      } else if (cardState === 'with-files') {
        return theme === 'light' ? (
          <NASCardExpandedWithFilesLight
            title={data.title}
            errorCode={data.errorCode}
            description={data.description}
            diagnostics={data.diagnostics || []}
            partsList={data.partsList || []}
            source={data.source}
            files={data.files || []}
            onCollapse={handleCollapse}
            onClose={onClose}
            onAskAI={onAskAI}
            onHelpful={onHelpful}
            onNotHelpful={onNotHelpful}
          />
        ) : (
          <NASCardExpandedWithFilesDark
            title={data.title}
            errorCode={data.errorCode}
            description={data.description}
            diagnostics={data.diagnostics || []}
            partsList={data.partsList || []}
            source={data.source}
            files={data.files || []}
            onCollapse={handleCollapse}
            onClose={onClose}
            onAskAI={onAskAI}
            onHelpful={onHelpful}
            onNotHelpful={onNotHelpful}
          />
        );
      }
    } else if (type === 'ai-response') {
      // AI Response card (no cascade - always expanded)
      return theme === 'light' ? (
        <AIResponseCardLight
          answer={data.answer || ''}
          sources={data.sources}
          modelUsed={data.modelUsed}
          reasoning={data.reasoning}
          onMinimize={handleCollapse}
          onClose={onClose}
          onHelpful={onHelpful}
          onNotHelpful={onNotHelpful}
        />
      ) : (
        <AIResponseCardDark
          answer={data.answer || ''}
          sources={data.sources}
          modelUsed={data.modelUsed}
          reasoning={data.reasoning}
          onMinimize={handleCollapse}
          onClose={onClose}
          onHelpful={onHelpful}
          onNotHelpful={onNotHelpful}
        />
      );
    }
    
    return null;
  };
  
  return (
    <div className="cascade-card-wrapper">
      {renderCard()}
    </div>
  );
}