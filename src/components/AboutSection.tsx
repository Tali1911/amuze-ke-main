import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Users, Briefcase } from 'lucide-react';

const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-4 bg-white">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <span className="inline-block text-forest-700 bg-forest-100 px-3 py-1 rounded-full text-sm font-medium mb-4">
            About Us
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Discover Our Story
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="who-we-are">
            <AccordionTrigger className="text-xl font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-forest-600" />
                Who We Are
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-gray-700 space-y-4 pt-4">
              <p>
                We are the company dedicated to providing high-quality learning and recreational opportunities for kids, with a focus on the great outdoors. We believe that children learn best through play and exploration, and we strive to create fun and impactful experiences that will inspire a lifelong love of learning.
              </p>
              
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-forest-700 mb-2">Our Mission</h3>
                  <p>Our mission is to provide fun, safe, and transformative outdoor experiences for children in Nairobi and beyond. Through our carefully designed programs and services we aim to stimulate their creativity, foster their social and emotional growth, and nurture a sense of wonder and exploration.</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-forest-700 mb-2">Our Vision</h3>
                  <p>Our vision at Amuse Kenya is to be a leader in the field of experiential education, providing innovative and impactful programs that inspire children to become lifelong learners and stewards of the natural world.</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-forest-700 mb-2">Our Purpose</h3>
                  <p>Our purpose is to empower children to discover their full potential through engaging and educational programs that foster creativity, curiosity, and a deep connection to the natural world.</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="what-we-do">
            <AccordionTrigger className="text-xl font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-forest-600" />
                What We Do
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-gray-700 space-y-6 pt-4">
              <div className="grid gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-forest-700 mb-4">1. Activities and Events</h3>
                  <div className="bg-forest-50 p-6 rounded-lg">
                    <p className="mb-4">Join Amuse Kenya at Sigiria Forest (Gate F) Monday- Sunday from 08:00AM to 05:00PM for a full range of forest activities for your children to enjoy. See our activities and calendar here. To contact us for more information or to prebook, email us at info@amusekenya.co.ke or call us at 0114705763.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        "Obstacle Course",
                        "Ropes Course",
                        "Outdoor Exploration",
                        "Games",
                        "Mindfulness",
                        "Arts and Crafts",
                        "Horseback Riding",
                        "Orienteering",
                        "Survival Skills",
                        "Martial Arts",
                        "Archery (Off-site only)",
                        "Team building",
                        "Messy play"
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-md shadow-sm">
                          <div className="w-2 h-2 bg-forest-500 rounded-full"></div>
                          <span>{activity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-forest-700 mb-4">2. Camps</h3>
                  <div className="bg-forest-50 p-6 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Holiday Camps</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>New year camp</li>
                          <li>Easter camp</li>
                          <li>Summer Camp</li>
                          <li>Christmas Camp</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Term Breaks</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>February Camp</li>
                          <li>March Camp (French school)</li>
                          <li>May Camp (French school)</li>
                          <li>October Camp</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Hours + Pricing</h4>
                      <p>Camp runs from 9AM-1PM/11AM-3PM for a Half Day (1500 KSH) or from 9AM-3PM for a Full Day (2500 KSH).</p>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">What to Wear + Carry</h4>
                      <p>Kids should arrive in comfortable, forest appropriate clothing depending on the weather during camp. A sun hat and sunscreen during sunny days is advised, as are mud boots and raincoats for rainy days.</p>
                      <p>For Half Days, kids should arrive with water and a snack.</p>
                      <p>For Full Days, kids should arrive with water, a snack and lunch.</p>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Additional Information</h4>
                      <p>Mondays we have archery sessions in the afternoon. Our professional-grade equipment is available for participants aged 8 years and older. The sessions take place offsite within walking distance from the main camp area. We provide all the necessary safety gear for children to learn and enjoy this exciting sport.</p>
                      <p>Every Tuesday and Thursday are mountain biking days so campers bring their bikes, helmets and safety gear. We always have other activities for those who don’t want to ride. Bikes can also be rented at the forest.</p>
                      <p>Every Wednesday and Friday afternoon for horse riding sessions suitable for all levels of experience. Children are welcome to bring their personal gear, although we provide shared helmets for their safety.</p>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Customized Camps</h4>
                      <p>Not seeing the dates you are looking for? Email us at info@amusekenya.co.ke or call us at 0114705763 to create a customized camp for your school, family or friend group. Our flexible camp programs can be customized to align with your goals and preferences and can happen at our station in Karura forest or brought to your desired location.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-forest-700 mb-4">3. Birthdays</h3>
                  <div className="bg-forest-50 p-6 rounded-lg space-y-4">
                    <h4 className="font-semibold mb-2">Customized Birthday Parties</h4>
                    <p>Customized Birthdays at Sigiria Karura Forest offer a blend of adventure, laughter, and unforgettable memories with exclusive access to our park for all your guests. Our dedicated staff handles logistics, ensuring that every detail – from decorations, seating areas to plenty of delightful activities—is taken care of. Whether you’re celebrating with a picnic-style gathering or embarking on an adventurous treasure hunt or organizing a mountain biking challenge, nature sets the stage for your child’s special day.</p>

                    <h4 className="font-semibold mt-4 mb-2">What We Offer</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Customized Party Planning: We tailor each party to ensure your child’s dream birthday becomes a reality. From themes to decorations, we pay attention to every detail.</li>
                      <li>Exclusive Access to Sigiria Forest: Our facilities at Sigiria Forest provide the perfect backdrop for outdoor celebrations. Explore the lush greenery, breathe in the fresh air, and let the festivities begin.</li>
                      <li>Engaging Activities for All Ages: Our games, crafts, and challenges cater to both children and adults. Whether it’s a treasure hunt or a friendly outdoor challenge, everyone will have a blast.</li>
                      <li>Interactive Fun: We keep the energy high with interactive activities that entertain and engage. From forest adventures to team-building challenges, there’s something for everyone.</li>
                      <li>Dedicated Staff for Safety and Entertainment: Our friendly team ensures that kids have a great time while staying safe. Let us handle the details so you can focus on making memories.</li>
                    </ul>

                    <h4 className="font-semibold mt-4 mb-2">Birthday Activities To Choose From Include:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Rope course</li>
                      <li>Obstacle course</li>
                      <li>Tree planting in the forest</li>
                      <li>Orienteering</li>
                      <li>Archery</li>
                      <li>Trampolines</li>
                      <li>Mountain biking</li>
                      <li>Horseback riding (allowed in the forest only on weekdays)</li>
                      <li>Board games</li>
                      <li>Treasure and scavenger hunts</li>
                      <li>Water games and water balloon fun</li>
                      <li>Nature walks</li>
                      <li>Bracelet making</li>
                      <li>Outdoor painting</li>
                      <li>Teepee building</li>
                      <li>Nature trivia</li>
                    </ul>

                    <h4 className="font-semibold mt-4 mb-2">Pricing</h4>
                    <p>Pricing depends on the number of kids, chosen activities, and duration.</p>

                    <h4 className="font-semibold mt-4 mb-2">Customized Mobile Birthday Parties</h4>
                    <p>Can’t make it to the forest? No worries! We bring the celebration to you.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Location of Your Choice (Indoors or Outdoors) - Whether it’s your home, a garden, or any preferred venue, we’ll set up the fun.</li>
                      <li>Pricing varies based on the number of kids, location, chosen activities, and duration.</li>
                    </ul>
                    <p>Let’s make your next birthday unforgettable! Contact us at info@amusekenya.co.ke or call 0114705763 to start planning.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-forest-700 mb-4">4. For Schools</h3>
                  <div className="bg-forest-50 p-6 rounded-lg space-y-4">
                    <h4 className="font-semibold mb-2">Inspiring Learning through Outdoor Adventures</h4>
                    <p>At Amuse Kenya, we believe that the great outdoors is a powerful classroom. Our mission is to collaborate with Kenyan schools, providing experiential learning opportunities that ignite curiosity, boost academic performance, and foster environmental stewardship. From customized Outdoor Classrooms to thrilling After School Clubs and unforgettable Outdoor Field Trips and Sleep Away Camps, we’re here to create educational experiences your students will cherish.</p>

                    <h4 className="font-semibold mt-4 mb-2">Outdoor Classrooms</h4>
                    <p>Welcome to Amuse Outdoor Classroom! Here, education takes root in the forest and natural ecosystems. Our hands-on learning approach connects students to the wonders of the outdoors, enhancing their academic journey.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Customized Curriculums: We co-create content tailored to your students’ learning needs.</li>
                      <li>Flexible Duration: Programs can run for a day, a week, a term, or be fully customized.</li>
                      <li>Location: Choose Sigiria Forest, Karura (Gate F), your school or any outdoor location of your preference.</li>
                      <li>Safety Measures</li>
                    </ul>
                    <p>Contact us at info@amusekenya.co.ke or call 0114705763 to plan your next Outdoor Classroom adventure.</p>

                    <h4 className="font-semibold mt-4 mb-2">Field Trips and Sleep Away Camps for Schools</h4>
                    <p>Amuse Kenya offers enriching field trips and sleep-away camps for schools, designed to provide students with immersive outdoor experiences that foster learning, personal growth, and unforgettable memories.</p>

                    <h4 className="font-semibold mt-4 mb-2">Field Trips</h4>
                    <p>Our field trips are tailored to enhance classroom learning with hands-on experiences in nature. Students will engage in activities that promote environmental awareness, teamwork, and practical skills.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Educational Adventures: Students explore nature, learn about ecosystems, and participate in guided nature walks, scavenger hunts, and interactive lessons. We offer complementary activities that enhance the experience, tailored to complement specific learning subjects or themes covered during the term.</li>
                      <li>Team Building: Fun and challenging activities like obstacle courses and group games help students build teamwork, leadership, and problem-solving skills.</li>
                    </ul>

                    <h4 className="font-semibold mt-4 mb-2">Sleep Away Camps</h4>
                    <p>Our sleep-away camps offer an extended adventure, providing students with the opportunity to fully immerse themselves in nature and develop independence, resilience, and lifelong friendships.</p>
                    <h4 className="font-semibold mt-4 mb-2">Highlights:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Multi-Day Camping Experiences: Students enjoy a variety of activities such as camping in spacious tents, archery, orienteering, bush craft, and night hikes, all designed to promote outdoor skills, self-confidence, independence and team work</li>
                      <li>Movie Nights Under the Stars: Evenings are filled with campfire stories, bonding sessions, and outdoor movie nights, creating a magical and memorable camping experience.</li>
                      <li>Safe and Supportive Environment: Our camps are carefully supervised, with a low student-to-instructor ratio and comprehensive safety measures in place.</li>
                    </ul>
                    <p>Suitable for Various Age Groups: Our field trips and camps are tailored to suit different age groups from kindergarten age to high school ensuring that all students have a safe, enjoyable, and enriching meaningful experience.</p>
                    <p>To book a field trip or sleep-away camp for your school email us at info@amusekenya.co.ke or call 0114705763.</p>

                    <h4 className="font-semibold mt-4 mb-2">After School Clubs</h4>
                    <p>Our After School Clubs at Amuse Kenya are the perfect environment for children to thrive, discover new talents, and build lasting friendships. We offer a wide range of activities designed to promote physical fitness, creativity, teamwork, and personal growth.</p>
                    <h4 className="font-semibold mt-4 mb-2">Highlights:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Passion Exploration: Students have the opportunity to explore their interests and develop new skills in a supportive environment.</li>
                      <li>Experienced Instructors: Our dedicated team of instructors lead engaging sessions that inspire and empower children.</li>
                      <li>Location: Our clubs are held at the beautiful Sigiria Forest in Karura (Gate F), at your school or a location of your choice.</li>
                    </ul>
                    <h4 className="font-semibold mt-4 mb-2">Safety Measures:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>All activities are supervised to ensure a secure and enjoyable experience for every child.</li>
                      <li>We maintain a low student-to-instructor ratio to provide personalized attention.</li>
                    </ul>
                    <p>Get started with your next After School Club by emailing us at info@amusekenya.co.ke</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-forest-700 mb-4">5. Adventures</h3>
                  <div className="bg-forest-50 p-6 rounded-lg space-y-4">
                    <h4 className="font-semibold mb-2">Amuse Adventures</h4>
                    <p>Welcome to Amuse Adventures, where young explorers aged 8 and above can embark on the thrill of a lifetime while learning valuable camping skills in the heart of nature. Our carefully curated programs combine adventure, learning, and camaraderie, creating unforgettable memories for your children and teenagers.</p>

                    <h4 className="font-semibold mt-4 mb-2">Adventure Camps</h4>
                    <p>Our Sleep Away Adventure Camps offer a unique opportunity for young adventurers to enhance their independence, experience the excitement of the great outdoors, and acquire essential bush craft knowledge.</p>

                    <h4 className="font-semibold mt-4 mb-2">What Awaits Your Child?</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Thrilling Activities: Picture your child white water rafting down roaring rivers, scaling rock faces, and hitting bullseyes in archery. Our campers don’t just learn about adventure; they live it!</li>
                      <li>Campfire Bonding: As the sun sets, the campfire crackles to life. Stories are shared, friendships are forged, and marshmallows are toasted to perfection.</li>
                      <li>Expert guidance: Our experienced camp leaders guide campers through immersive activities, team-building exercises, and thrilling outdoor games Our experienced camp leaders guide campers through bush craft skills—building shelters, identifying edible plants, and mastering fire-making techniques. These are skills that ignite confidence.</li>
                      <li>Safe and Supported: Our chaperones ensure safety while campers explore. They are with the campers the entire time. All your child has to do is bring an adventure-ready spirit!</li>
                      <li>Life Skills: From navigating challenging terrains to mastering campfire building, our adventures cultivate self-confidence and leadership qualities.</li>
                    </ul>

                    <h4 className="font-semibold mt-4 mb-2">Why Choose Amuse Adventures?</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Passion for Exploration: We believe in nurturing curiosity and providing opportunities to explore.</li>
                      <li>Unlocking Potential: From conquering fears to leading a team, our adventures empower children to discover their inner strength.</li>
                      <li>Endless Memories: Campfires, stargazing, and late-night giggles—these moments stay with campers long after the tents are packed away.</li>
                    </ul>

                    <p>Get Ready for Adventure! Email us at info@amusekenya.co.ke or call 0114705763 to start planning your child’s next Sleep Away adventure experience. Let’s create memories that soar beyond the ordinary!</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-forest-700 mb-4">6. Residentials</h3>
                  <div className="bg-forest-50 p-6 rounded-lg space-y-4">
                    <p>We’re excited to announce our initiative to bring engaging and enriching activities right to your doorstep. Our aim is to foster a sense of community while providing children with a platform for socializing, interaction, and most importantly, fun! Email us at info@amusekenya.co.ke or call us at 0114705763 to start planning.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-forest-700 mb-4">7. Bespoke Events & Collaborations</h3>
                  <div className="bg-forest-50 p-6 rounded-lg space-y-4">
                    <p>Do you have a Bespoke Event or Collaboration that you would like to arrange with Amuse Kenya? Email us at info@amusekenya.co.ke or call us at 0114705763 to start planning!</p>
                    <h4 className="font-semibold mt-4 mb-2">Team Building</h4>
                    <p>Discover the power of teamwork with Amuse Kenya’s dynamic team building activities. Our customized programs blend adventure and learning to strengthen bonds and foster collaboration. Let us ignite your team’s potential and create unforgettable experiences together.</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
};

export default AboutSection;
