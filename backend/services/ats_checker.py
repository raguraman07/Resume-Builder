import re

PLATFORM_KEYWORDS = {
    'tech': [
        'python', 'javascript', 'react', 'node', 'git', 'docker', 'aws', 'sql', 'database', 
        'api', 'typescript', 'agile', 'software', 'developer', 'engineer', 'architecture', 
        'cloud', 'frontend', 'backend', 'ci/cd', 'kubernetes', 'java', 'c++', 'linux'
    ],
    'corporate': [
        'management', 'strategy', 'revenue', 'analysis', 'growth', 'project', 'client', 
        'sales', 'finance', 'business', 'marketing', 'roi', 'operations', 'reporting', 
        'executive', 'dashboard', 'metrics', 'budget', 'kpi', 'stakeholder'
    ],
    'creative': [
        'figma', 'portfolio', 'design', 'creative', 'adobe', 'illustrator', 'photoshop', 
        'branding', 'wireframe', 'prototype', 'ux', 'ui', 'visual', 'content', 
        'user experience', 'typography', 'sketch', 'layout', 'motion', 'artwork'
    ],
    'freelance': [
        'deliverable', 'client', 'contract', 'timeline', 'milestone', 'portfolio', 
        'communication', 'self-starter', 'remote', 'management', 'project', 'value', 
        'requirements', 'proposal', 'negotiation', 'independent', 'freelancer'
    ],
    'general': [
        'communication', 'leadership', 'team', 'project', 'organization', 'problem-solving', 
        'analysis', 'writing', 'detail-oriented', 'collaboration', 'initiative', 'customer'
    ]
}

ACTION_VERBS = [
    'achieved', 'acquired', 'addressed', 'analyzed', 'built', 'calculated', 'centralized', 
    'collaborated', 'created', 'designed', 'developed', 'directed', 'engineered', 'established', 
    'executed', 'expanded', 'formulated', 'generated', 'guided', 'implemented', 'improved', 
    'increased', 'initiated', 'launched', 'led', 'managed', 'maximized', 'negotiated', 
    'optimized', 'organized', 'oversaw', 'planned', 'produced', 'reduced', 'resolved', 
    'spearheaded', 'streamlined', 'strengthened', 'supervised', 'trained', 'transformed'
]

def check_ats_score(resume_data, platform):
    """
    Analyzes resume data and returns an ATS score and improvement suggestions.
    """
    score = 0
    suggestions = []
    
    # 1. Contact Information Check (Max 20 points)
    contact = resume_data.get('personalInfo', {})
    contact_score = 0
    missing_contact = []
    
    if contact.get('fullName'):
        contact_score += 5
    else:
        missing_contact.append("Full Name")
        
    if contact.get('email'):
        contact_score += 5
    else:
        missing_contact.append("Email Address")
        
    if contact.get('phone'):
        contact_score += 4
    else:
        missing_contact.append("Phone Number")
        
    if contact.get('linkedIn') or contact.get('linkedin'):
        contact_score += 3
    else:
        missing_contact.append("LinkedIn profile link")
        
    if contact.get('github') or contact.get('portfolio'):
        contact_score += 3
    else:
        missing_contact.append("Portfolio or GitHub link")
        
    score += contact_score
    if missing_contact:
        suggestions.append({
            'section': 'Contact Information',
            'type': 'warning',
            'message': f"Add missing contact details: {', '.join(missing_contact)} to improve reachability."
        })
    else:
        suggestions.append({
            'section': 'Contact Information',
            'type': 'success',
            'message': "Contact information is complete and well-formatted."
        })

    # 2. Section Completeness Check (Max 30 points)
    sections_present = []
    sections_missing = []
    
    # Check Summary
    if contact.get('summary') or resume_data.get('summary'):
        score += 5
        sections_present.append("Summary")
    else:
        sections_missing.append("Professional Summary")
        
    # Check Experience
    experience = resume_data.get('experience', [])
    if experience and len(experience) > 0:
        score += 10
        sections_present.append("Work Experience")
    else:
        sections_missing.append("Work Experience")
        
    # Check Education
    education = resume_data.get('education', [])
    if education and len(education) > 0:
        score += 5
        sections_present.append("Education")
    else:
        sections_missing.append("Education")
        
    # Check Skills
    skills = resume_data.get('skills', [])
    if skills and len(skills) > 0:
        score += 5
        sections_present.append("Skills")
    else:
        sections_missing.append("Skills")
        
    # Check Projects
    projects = resume_data.get('projects', [])
    if projects and len(projects) > 0:
        score += 5
        sections_present.append("Projects")
    else:
        sections_missing.append("Projects")
        
    if sections_missing:
        suggestions.append({
            'section': 'Sections',
            'type': 'warning',
            'message': f"Your resume is missing standard sections: {', '.join(sections_missing)}. Adding them increases searchability."
        })
    else:
        suggestions.append({
            'section': 'Sections',
            'type': 'success',
            'message': "All major resume sections (Summary, Experience, Education, Skills, Projects) are present."
        })

    # 3. Formatting & Length Check (Max 20 points)
    # Check total length (experience + projects + summary)
    text_content = ""
    text_content += contact.get('summary', '') + " " + resume_data.get('summary', '') + " "
    
    exp_bullet_count = 0
    exp_desc_word_count = 0
    for exp in experience:
        desc = exp.get('description', '')
        text_content += f"{exp.get('role', '')} {exp.get('company', '')} {desc} "
        if desc:
            exp_bullet_count += desc.count('\n') + 1
            exp_desc_word_count += len(desc.split())
            
    proj_desc_word_count = 0
    for proj in projects:
        desc = proj.get('description', '')
        text_content += f"{proj.get('name', '')} {desc} "
        if desc:
            proj_desc_word_count += len(desc.split())
            
    total_words = len(text_content.split())
    
    formatting_score = 0
    if 250 <= total_words <= 650:
        formatting_score += 10
        suggestions.append({
            'section': 'Formatting',
            'type': 'success',
            'message': f"Resume length is perfect ({total_words} words). Fits standard 1-2 page formatting."
        })
    elif total_words < 250:
        formatting_score += 5
        suggestions.append({
            'section': 'Formatting',
            'type': 'info',
            'message': f"Resume is a bit short ({total_words} words). Consider adding more details to your project/experience descriptions."
        })
    else:
        formatting_score += 5
        suggestions.append({
            'section': 'Formatting',
            'type': 'warning',
            'message': f"Resume is quite long ({total_words} words). Try to edit concisely to stay within 2 pages max."
        })
        
    # Check for Action Verbs
    found_verbs = []
    text_content_lower = text_content.lower()
    for verb in ACTION_VERBS:
        if re.search(r'\b' + verb + r'\b', text_content_lower):
            found_verbs.append(verb)
            
    if len(found_verbs) >= 5:
        formatting_score += 10
        suggestions.append({
            'section': 'Action Verbs',
            'type': 'success',
            'message': f"Great use of action-oriented verbs ({', '.join(found_verbs[:4])}...)."
        })
    elif 1 <= len(found_verbs) < 5:
        formatting_score += 5
        suggestions.append({
            'section': 'Action Verbs',
            'type': 'info',
            'message': f"Add more impact verbs (e.g., 'spearheaded', 'optimized', 'engineered') instead of passive phrasing like 'responsible for'."
        })
    else:
        suggestions.append({
            'section': 'Action Verbs',
            'type': 'warning',
            'message': "No key active/impact verbs detected. Revise descriptions using terms like 'developed', 'led', or 'maximized'."
        })
        
    score += formatting_score

    # 4. Platform-Specific Keyword Matching (Max 30 points)
    target_platform = platform if platform in PLATFORM_KEYWORDS else 'general'
    keywords_to_check = PLATFORM_KEYWORDS[target_platform]
    
    # Compile all skills
    skills_list = []
    skills_data = resume_data.get('skills', [])
    if isinstance(skills_data, list):
        for s in skills_data:
            if isinstance(s, dict):
                skills_list.append(s.get('name', '').lower())
                # If skills has subcategories/tags
                tags = s.get('tags', [])
                if isinstance(tags, list):
                    skills_list.extend([t.lower() for t in tags])
            elif isinstance(s, str):
                skills_list.append(s.lower())
                
    # Combine text check
    full_text_lower = text_content_lower + " " + " ".join(skills_list)
    
    matched_keywords = []
    missing_keywords = []
    for kw in keywords_to_check:
        if kw in full_text_lower:
            matched_keywords.append(kw)
        else:
            missing_keywords.append(kw)
            
    # Calculate score based on ratio of matched keywords
    keyword_ratio = len(matched_keywords) / len(keywords_to_check) if keywords_to_check else 0
    keyword_score = min(int(keyword_ratio * 30), 30)
    score += keyword_score
    
    if len(matched_keywords) >= 5:
        suggestions.append({
            'section': 'Keyword Optimization',
            'type': 'success',
            'message': f"Matched {len(matched_keywords)} target keywords for {target_platform.capitalize()} resumes."
        })
    else:
        suggestions.append({
            'section': 'Keyword Optimization',
            'type': 'warning',
            'message': f"Low keyword optimization for target platform: {target_platform.capitalize()}. Try including: {', '.join(missing_keywords[:6])}."
        })
        
    # Scale score out of 100 just in case
    score = min(max(int(score), 10), 100)
    
    return {
        'score': score,
        'suggestions': suggestions,
        'matchedKeywords': matched_keywords,
        'missingKeywords': missing_keywords[:8]
    }
