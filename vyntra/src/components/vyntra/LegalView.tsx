import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';

const legalDocs = {
  terms: {
    title: "Terms of Service",
    content: "By using Vyntra, you agree to our Terms of Service. These terms govern your use of the Vyntra platform, including any features, services, technologies, or software we offer. We reserve the right to suspend or terminate accounts that violate our community guidelines, spread harmful content, or engage in malicious activities. We may update these terms from time to time, and continued use of the platform constitutes your agreement to the new terms."
  },
  privacy: {
    title: "Privacy Policy",
    content: "At Vyntra, we deeply respect your privacy. This Privacy Policy outlines what data we collect, how it's used, and how it is shared. All private user data, including direct messages and account settings, is securely stored and encrypted. We do not sell your personal data to unauthorized third parties. By using Vyntra, you consent to our data practices as described in this detailed policy. We aim for full transparency and user control."
  },
  cookie: {
    title: "Cookie Policy",
    content: "We use cookies and similar tracking technologies to improve your experience, remember your user preferences, ensure platform security, and show more relevant content. Cookies are small pieces of text sent to your browser that help our platform remember information about your visit. You can manage your cookie preferences in your browser settings at any time, though some features of the platform may not function correctly if certain cookies are disabled."
  },
  accessibility: {
    title: "Accessibility",
    content: "Vyntra is fully committed to digital accessibility. We are continually improving the user experience for everyone, regardless of physical or cognitive abilities, and applying the relevant accessibility standards. If you encounter any barriers while using Vyntra, please reach out to our support team. We value your feedback and are constantly working to make the platform as inclusive as possible for our diverse global community."
  },
  ads: {
    title: "Ads Info",
    content: "Ads on Vyntra are personalized based on your activity to show you more relevant content. We believe in providing value to our advertisers while keeping the user experience clean and non-intrusive. Our ad partners may use cookies or similar technologies to measure the effectiveness of their campaigns. You can adjust your ad personalization settings at any time in the main settings area of your account."
  },
  more: {
    title: "More Info",
    content: "Vyntra Corp. is a visionary tech company building next-generation social tools. Our mission is to connect the world through intuitive interfaces, AI-powered insights, and seamless interactions. We believe in a collaborative, open digital future where every voice matters. For press, business, and partnership opportunities, please contact our corporate relations team. Thank you for being a part of the Vyntra journey."
  }
};

export function LegalView({ docType }: { docType: string }) {
  const { setActiveTab } = useNavigation();
  
  const doc = legalDocs[docType as keyof typeof legalDocs] || legalDocs.terms;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-vyntra-bg/80 backdrop-blur-md border-b border-white/10 p-4 flex items-center gap-6">
        <button 
          onClick={() => setActiveTab('feed')}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col">
          <h1 className="font-bold text-xl">{doc.title}</h1>
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-3xl mx-auto w-full animate-fadeIn">
        <div className="bg-[#1A1F2C] border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl">
          <h2 className="text-3xl font-bold mb-6 text-white leading-tight">
            {doc.title}
          </h2>
          <div className="w-16 h-1 bg-vyntra-primary rounded-full mb-8"></div>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-vyntra-text-sec text-lg leading-relaxed whitespace-pre-wrap">
              {doc.content}
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-sm text-vyntra-text-sec">
              Last updated: June 2026. © Vyntra Corp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
