package com.orchestranetworks.ps.customDirectory;

import java.util.*;

import javax.naming.ldap.*;

import org.apache.commons.lang3.*;

import com.orchestranetworks.service.*;

public class User
{
	private LdapName ldapName = null;
	private UserReference userReference;
	private Map<String, String> properties = new HashMap<>();
	private String loginName;
	private String emailAddress = null;
	private String firstName = null;
	private String lastName = null;
	private String faxNumber = null;
	private String JobFunction = null;
	private String mobilePhoneNumber = null;
	private String officePhoneNumber = null;
	private String salutation = null;
	private boolean ssoInfo;
	private List<String> roles = new ArrayList<>();

	public Map<String, String> getProperties()
	{
		return properties;
	}

	public LdapName getLdapName()
	{
		return ldapName;
	}
	public void setLdapName(LdapName ldapName)
	{
		this.ldapName = ldapName;
	}
	public UserReference getUserReference()
	{
		return userReference;
	}

	public boolean addProperty(String key, String value)
	{
		return properties.put(key, value) != null;
	}

	public void setUserReference(UserReference userReference)
	{
		this.userReference = userReference;
	}
	public String getLoginName()
	{
		return loginName;
	}
	public void setLoginName(String loginName)
	{
		this.loginName = loginName;
	}
	public String getFirstName()
	{
		return firstName;
	}
	public void setFirstName(String firstName)
	{
		this.firstName = firstName;
	}
	public String getLastName()
	{
		return lastName;
	}
	public void setLastName(String lastName)
	{
		this.lastName = lastName;
	}
	public String getEmailAddress()
	{
		return emailAddress;
	}
	public void setEmailAddress(String emailAddress)
	{
		this.emailAddress = emailAddress;
	}
	public String getFaxNumber()
	{
		return faxNumber;
	}
	public void setFaxNumber(String faxNumber)
	{
		this.faxNumber = faxNumber;
	}
	public String getJobFunction()
	{
		return JobFunction;
	}
	public void setJobFunction(String jobFunction)
	{
		JobFunction = jobFunction;
	}
	public String getMobilePhoneNumber()
	{
		return mobilePhoneNumber;
	}
	public void setMobilePhoneNumber(String mobilePhoneNumber)
	{
		this.mobilePhoneNumber = mobilePhoneNumber;
	}
	public String getOfficePhoneNumber()
	{
		return officePhoneNumber;
	}
	public void setOfficePhoneNumber(String officePhoneNumber)
	{
		this.officePhoneNumber = officePhoneNumber;
	}
	public String getSalutation()
	{
		return salutation;
	}
	public void setSalutation(String salutation)
	{
		this.salutation = salutation;
	}

	public boolean AddRole(String roleName)
	{
		if (StringUtils.isEmpty(roleName) || roles.contains(roleName))
		{
			return false;
		}
		return roles.add(roleName);
	}

	public List<String> getRoles()
	{
		return roles;
	}

	public void setRoles(List<String> roles)
	{
		if (roles != null)
		{
			this.roles.addAll(roles);
		}
	}

	public Boolean isUserInRole(Role role)
	{
		for (String roleName : roles)
		{
			if (roleName != null && roleName.equalsIgnoreCase(role.getRoleName()))
			{
				return true;
			}
		}
		return null;
	}

	public boolean getSsoInfo()
	{
		return ssoInfo;
	}

	public void setSsoInfo(boolean ssoInfo)
	{
		this.ssoInfo = ssoInfo;
	}

}
