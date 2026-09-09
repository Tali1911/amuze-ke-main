import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
const ContactForm = () => {
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!formData.email || !formData.email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields
    if (!formData.name || !formData.subject || !formData.message) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    // Construct mailto link
    const emailBody = `Name: ${formData.name}%0D%0AEmail: ${formData.email}%0D%0A%0D%0AMessage:%0D%0A${encodeURIComponent(formData.message)}`;
    const mailtoLink = `mailto:info@amusekenya.co.ke?subject=${encodeURIComponent(formData.subject)}&body=${emailBody}`;
    
    // Open default mail client
    window.location.href = mailtoLink;

    toast({
      title: "Opening Email Client",
      description: "Your default email application will open with the message pre-filled."
    });
  };
  return <section id="contact" className="py-24 px-4 bg-earth-50 relative overflow-hidden">
      {/* Background Element */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-earth-100 -skew-x-12 transform translate-x-1/2 z-0"></div>
      
      <div className="container mx-auto relative z-10">
        
        
        <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
          {/* Contact Information */}
          <div className="w-full md:w-2/5 bg-forest-700 text-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-8 h-full flex flex-col">
              <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start">
                  <div className="bg-white/10 p-2 rounded mr-4">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium">Find us Here</h4>
                    <p className="text-forest-100">Karura Forest<br />Gate F, Thigiri Ridge</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-white/10 p-2 rounded mr-4">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium">Get In touch</h4>
                    <p className="text-forest-100">info@amusekenya.co.ke</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-white/10 p-2 rounded mr-4">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium">Call Us</h4>
                    <p className="text-forest-100">0114 705 763</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-500 p-2 rounded mr-4">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium">WhatsApp</h4>
                    <a 
                      href="https://api.whatsapp.com/send/?phone=254114705763&text=Hello! I need assistance from Amuse Kenya&type=phone_number"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-forest-100 hover:text-white transition-colors"
                    >
                      Chat with us
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="mt-auto">
                <h4 className="font-medium mb-2">Training Hours</h4>
                <p className="text-forest-100">Monday to Sunday: 08:00am - 05:00pm</p>
              </div>
            </div>
          </div>
          
          {/* Contact Form */}
          <div className="w-full md:w-3/5">
            <div className="glass-card rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Your Name</label>
                      <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 outline-none transition-all" placeholder="Your Name" />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email Address</label>
                      <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 outline-none transition-all" placeholder="your.email@example.com" />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">Subject</label>
                    <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 outline-none transition-all" placeholder="What is this about?" />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Your Message</label>
                    <Textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={6} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500 outline-none transition-all resize-none" placeholder="Share your thoughts, questions, or feedback with us..." />
                  </div>
                  
                  <button type="submit" className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-forest-600 hover:bg-forest-700 text-white shadow-md hover:shadow-lg">
                    Send Message
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default ContactForm;