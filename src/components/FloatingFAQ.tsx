import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Helmet } from 'react-helmet-async';
import { faqService, type FAQItem } from '@/services/faqService';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const FloatingFAQ: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm here to help you with questions about Amuse Kenya's forest adventures. What would you like to know?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [faqData, setFaqData] = useState<FAQItem[]>([]);
  const [popularQuestions, setPopularQuestions] = useState<FAQItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      const data = await faqService.getPublishedFAQs();
      setFaqData(data);
      setPopularQuestions(data.filter(faq => faq.is_popular));
    } catch (error) {
      console.error('Error loading FAQs:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findBestMatch = (userInput: string): string | null => {
    const input = userInput.toLowerCase();
    
    // Simple keyword matching
    for (const faq of faqData) {
      const questionWords = faq.question.toLowerCase().split(' ');
      const answerWords = faq.answer.toLowerCase().split(' ');
      const allWords = [...questionWords, ...answerWords];
      
      const inputWords = input.split(' ');
      const matchCount = inputWords.filter(word => 
        word.length > 3 && allWords.some(faqWord => faqWord.includes(word))
      ).length;
      
      if (matchCount >= 2) {
        return faq.answer;
      }
    }
    
    return null;
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Find answer
    const answer = findBestMatch(inputValue);
    
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: answer || "I don't have a specific answer to that question. For detailed assistance, I'd recommend contacting our team directly. Would you like me to help you get in touch with us?",
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      
      // If no answer found, show contact option
      if (!answer) {
        setTimeout(() => {
          const contactMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: "You can reach us through our contact form on this website, or call us directly. Click the 'Contact Our Team' button below to get started!",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, contactMessage]);
        }, 1000);
      }
    }, 500);

    setInputValue('');
  };

  const handleQuestionClick = (faq: FAQItem) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: faq.question,
      isBot: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: faq.answer,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const scrollToContact = () => {
    setIsOpen(false);
    const contactSection = document.querySelector('section[aria-label="Contact information"]');
    contactSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      
      <TooltipProvider>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SheetTrigger asChild>
                <Button
                  className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
                  size="icon"
                  aria-label="Open FAQ"
                >
                  <MessageSquare className="h-6 w-6" />
                </Button>
              </SheetTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" className="mr-2">
              <p>Chat Assistant</p>
            </TooltipContent>
          </Tooltip>

          <SheetContent side="left" className="w-full sm:max-w-md flex flex-col">
            <SheetHeader className="space-y-2">
              <SheetTitle className="text-xl font-bold text-primary flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Chat Assistant
              </SheetTitle>
              <SheetDescription className="text-muted-foreground">
                Ask me anything about Amuse Kenya's forest adventures and programs.
              </SheetDescription>
            </SheetHeader>

            {/* Chat Messages */}
            <div className="flex-1 mt-4 mb-4 overflow-y-auto space-y-3 max-h-[60vh]">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  {message.isBot && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm leading-relaxed ${
                      message.isBot
                        ? 'bg-secondary/20 text-foreground'
                        : 'bg-primary text-primary-foreground ml-auto'
                    }`}
                  >
                    {message.text}
                  </div>
                  {!message.isBot && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Popular Questions - shown inline after messages */}
              {popularQuestions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex gap-2 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="max-w-[80%] p-3 rounded-lg text-sm bg-secondary/20 text-foreground">
                      <p className="text-sm text-muted-foreground mb-3">You might also want to know:</p>
                      <div className="space-y-2">
                        {popularQuestions.map((faq) => (
                          <Button
                            key={faq.id}
                            variant="outline"
                            size="sm"
                            className="w-full text-left text-xs h-auto p-2 whitespace-normal justify-start hover:bg-primary/10"
                            onClick={() => handleQuestionClick(faq)}
                          >
                            {faq.question}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Contact Button */}
            <div className="mb-4">
              <Button 
                onClick={scrollToContact} 
                variant="outline" 
                size="sm" 
                className="w-full"
              >
                Contact Our Team
              </Button>
            </div>

            {/* Input Area */}
            <div className="flex gap-2 border-t pt-4">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="icon" disabled={!inputValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </TooltipProvider>
    </>
  );
};

export default FloatingFAQ;
