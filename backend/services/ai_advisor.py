import os
import json
import re
import requests

# Fallback presets if no GEMINI_API_KEY is found.
# Organized by platform.
PLATFORM_PRESETS = {
    'tech': {
        'summary': [
            "Innovative Software Engineer with 5+ years of experience designing, developing, and deploying robust web applications. Skilled in modern JavaScript frameworks (React, Node.js) and cloud architectures (AWS, Docker). Proven track record of improving system latency by 30% and leading cross-functional developer teams.",
            "Full Stack Developer specializing in Python, TypeScript, and database optimization. Passionate about building scalable APIs, automated CI/CD pipelines, and responsive frontend interfaces. Adept at transforming complex requirements into high-performing, clean-code architectures.",
            "Detail-oriented Front End Developer with expertise in crafting interactive, responsive user interfaces. Expert in React, CSS3 Grid/Flexbox, and user-centric designs. Focused on optimizing performance and client satisfaction."
        ],
        'experience': [
            "Spearheaded the redesign of the core API gateway, migrating services to Node.js/TypeScript which improved response times by 35% and scaled system capacity to 10M+ monthly active requests.",
            "Developed and maintained responsive web applications using React and TailwindCSS, collaborating closely with UX designers to improve overall user engagement by 20%.",
            "Configured and managed automated CI/CD pipelines using Docker and GitHub Actions, reducing manual deployment efforts by 80% and increasing shipping frequency by 3x.",
            "Led a team of 4 junior developers to deliver a critical e-commerce microservice under budget, utilizing Agile methodologies and pair programming practices."
        ],
        'skills': "React, Node.js, Python, Django, TypeScript, Docker, AWS, PostgreSQL, MongoDB, Git, REST APIs, GraphQL, Kubernetes, Jest, Agile/Scrum"
    },
    'corporate': {
        'summary': [
            "Results-driven Financial Analyst with a strong background in corporate valuation, budgeting, and strategic planning. Expert at translating data analytics into actionable insights to increase profitability. Adept at presenting financial performance reports to C-suite executives.",
            "Accomplished Project Manager with 7+ years of experience leading complex, cross-departmental operations. Certified PMP skilled in resource allocation, risk mitigation, and Agile/Scrum workflows. Managed budgets up to $2M while delivering milestones 10% ahead of schedule.",
            "Dynamic Marketing Specialist with expertise in brand positioning, SEO, and digital campaign execution. Proven history of boosting customer acquisition by 45% through targeted multi-channel marketing funnels."
        ],
        'experience': [
            "Directed the strategic reallocation of a $1.5M operational budget, successfully reducing quarterly overhead by 12% without compromising deliverable quality.",
            "Managed cross-functional project teams of 15+ members to deliver enterprise client integrations, achieving 98% client satisfaction scores.",
            "Analyzed key performance indicators (KPIs) and prepared monthly executive dashboards, enabling faster, data-driven decisions by senior leadership.",
            "Negotiated vendor contracts, securing a 15% discount on licensing terms, resulting in annual savings of over $80,000."
        ],
        'skills': "Project Management, Financial Analysis, Strategic Planning, KPI Tracking, Budgeting, Risk Mitigation, Salesforce, Excel (VBA), Stakeholder Relations"
    },
    'creative': {
        'summary': [
            "Passionate UI/UX Designer with a focus on creating intuitive, visually stunning digital products. Expert in Figma, Adobe Creative Suite, and high-fidelity prototyping. Committed to user research and iterative testing to bridge the gap between design aesthetics and developer execution.",
            "Creative Director with 8+ years of experience leading digital campaigns, branding initiatives, and multimedia content. Skilled in art direction, vector graphics, and storytelling. Dedicated to elevating brand identity through cohesive visual design systems.",
            "Versatile Content Strategist and Copywriter with a portfolio spanning SaaS websites, social media campaigns, and editorial publications. Adept at defining brand voice and driving audience conversion."
        ],
        'experience': [
            "Designed and prototyped a mobile banking application from scratch in Figma, which improved user onboarding flow completion by 40% in post-launch usability tests.",
            "Established a cohesive design system and component library, shortening design-to-development handoff timelines by 50%.",
            "Conducted 25+ moderated user interviews and usability tests, translating raw feedback into actionable wireframe revisions and layout improvements.",
            "Led creative brainstorming and art direction for a nationwide product launch, increasing brand social media impressions by 150%."
        ],
        'skills': "Figma, User Interface (UI), User Experience (UX), Wireframing, Prototyping, Adobe Illustrator, Adobe Photoshop, User Research, Design Systems"
    },
    'freelance': {
        'summary': [
            "Independent Consultant and Full Stack Web Developer offering custom solutions for global clients. Specialized in WordPress custom development, Shopify integration, and static site generation. Committed to delivery timelines, transparent communication, and high-performance builds.",
            "Versatile Freelance Copywriter and SEO Consultant helping brands rank on Google and capture sales. Generated over $500k in client revenue by writing persuasive sales copy, email sequences, and high-quality SEO blog posts."
        ],
        'experience': [
            "Delivered 12+ client websites end-to-end, managing client requirements, milestone negotiations, styling customization, and hosting setup independently.",
            "Collaborated remotely with international startups to resolve technical layout bugs and page load speeds, increasing SEO visibility scores by 25%.",
            "Designed and executed custom automated client onboarding workflows, decreasing initial project definition timeframes from weeks to days."
        ],
        'skills': "Client Management, Milestone Tracking, Remote Collaboration, SEO, Custom Web Development, HTML/CSS, WordPress, Shopify, Proposal Writing"
    },
    'general': {
        'summary': [
            "Motivated professional with a strong foundation in team leadership, complex problem-solving, and efficient workflow execution. Possesses excellent communication skills and a quick learning curve. Dedicated to contributing value to dynamic, collaborative work environments.",
            "Detail-oriented administrator with experience coordinating schedules, managing client relationships, and streamlining internal databases. Dedicated to quality and operational efficiency."
        ],
        'experience': [
            "Coordinated team tasks and resource distribution, ensuring project deadlines were met consistently with high-quality deliverables.",
            "Resolved customer service issues and client escalations, boosting client retention rates by 15% through proactive communication.",
            "Streamlined departmental scheduling and database filing procedures, saving the team approximately 5 hours per week of manual clerical tasks."
        ],
        'skills': "Problem-Solving, Leadership, Team Collaboration, Organization, Communication, Customer Success, Adaptability, Time Management"
    }
}

def generate_ai_suggestions(prompt_type, current_text, platform):
    """
    Generates professional suggestions based on prompt type (summary, experience, or skill) 
    and target platform. Uses Gemini API if API key is configured.
    """
    api_key ="AQ.Ab8RN6JzKwcIhDOKY_i-E4CCYrzY6iJ4TLVuNu1b8bBWPib4Kw"
    platform = platform.lower() if platform else 'general'
    if platform not in PLATFORM_PRESETS:
        platform = 'general'
        
    # If API key is available, attempt real AI generation
    if api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            
            system_instruction = (
                f"You are a professional resume writer and career coach. Your task is to rewrite the user's "
                f"resume content to be highly professional, impactful, action-oriented, and tailored for a "
                f"'{platform.capitalize()}' target platform/industry. Use active verbs and quantify achievements if possible."
            )
            
            if prompt_type == 'summary':
                user_prompt = f"Rewrite this professional summary for a {platform} resume: '{current_text}'"
            elif prompt_type == 'experience':
                user_prompt = f"Rewrite this work experience description or bullet point into a highly professional statement (using the STAR format: Action + Impact + Result) for a {platform} resume: '{current_text}'"
            elif prompt_type == 'skills':
                user_prompt = f"Based on this skill list or description, suggest a formatted, modern comma-separated skill list for a {platform} resume: '{current_text}'"
            else:
                user_prompt = f"Improve this resume content: '{current_text}'"
                
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": f"{system_instruction}\n\nUser Input: {user_prompt}"}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 250
                }
            }
            
            headers = {'Content-Type': 'application/json'}
            response = requests.post(url, data=json.dumps(payload), headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                suggestion = result['candidates'][0]['content']['parts'][0]['text'].strip()
                # Clean up any leading/trailing quotes or markdown ticks
                suggestion = re.sub(r'^["\'`]+|["\'`]+$', '', suggestion)
                return {
                    'success': True,
                    'suggestion': suggestion,
                    'source': 'Gemini AI'
                }
        except Exception as e:
            # Fall back silently if API call fails
            pass

    # Rule-based fallback suggestion engine
    presets = PLATFORM_PRESETS[platform]
    
    if prompt_type == 'summary':
        # Select matching fallback based on keywords, otherwise return standard list
        suggestion = presets['summary'][0]
        if current_text:
            current_lower = current_text.lower()
            for s in presets['summary']:
                # Find the preset summary that shares the most keywords
                score = sum(1 for word in current_lower.split() if word in s.lower())
                if score >= 3:
                    suggestion = s
                    break
        return {
            'success': True,
            'suggestion': suggestion,
            'suggestions': presets['summary'],
            'source': 'Advisor Presets (Fallback)'
        }
        
    elif prompt_type == 'experience':
        suggestion = presets['experience'][0]
        if current_text:
            current_lower = current_text.lower()
            # If the user typed something, attempt to map keywords to a preset experience statement
            best_match = None
            max_score = -1
            for exp in presets['experience']:
                score = sum(1 for word in current_lower.split() if word in exp.lower())
                if score > max_score:
                    max_score = score
                    best_match = exp
            if best_match and max_score > 0:
                suggestion = best_match
            else:
                # If no clear keyword matches, write a generic enhanced bullet combining user input + active verbs
                words = current_text.strip().rstrip('.')
                suggestion = f"Spearheaded and executed: '{words}', driving operational efficiency and boosting project output metrics by 15%."
                
        return {
            'success': True,
            'suggestion': suggestion,
            'suggestions': presets['experience'],
            'source': 'Advisor Presets (Fallback)'
        }
        
    elif prompt_type == 'skills':
        return {
            'success': True,
            'suggestion': presets['skills'],
            'source': 'Advisor Presets (Fallback)'
        }
        
    return {
        'success': False,
        'message': "Invalid request details."
    }
