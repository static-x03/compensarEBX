/*
 * Copyright Orchestra Networks 2000-2012. All rights reserved.
 */
package com.orchestranetworks.ps.customDirectory;

import java.text.*;

import javax.naming.ldap.*;

import com.orchestranetworks.schema.*;

/**
 */
public class LdapDirectoryConfig implements ExternalDirectoryConfig
{
	// Server configuration 
	protected String ldapServerURL;
	protected String credential;
	protected LdapName bindDN;
	protected String referralPolicy;

	// base Domain name, all searches starts from here in the ldap tree.
	protected LdapName baseDN;

	// searching to for a user. login sometimes require to pass in the LDAP user not just a name.
	// it depends how the user info is stored on the server.
	protected String _userSearch;
	protected MessageFormat userSearch;

	protected String _userLogin;
	protected MessageFormat userLogin;

	protected LdapName membershipBase;
	protected String _membershipRole;
	protected MessageFormat membershipRole;
	protected String _membershipFilter;
	protected MessageFormat membershipFilter;

	protected LdapName reqLogin_membershipBase;
	protected String _reqLogin_role;
	protected MessageFormat reqLogin_role;
	//	protected String _reqLogin_membershipFilter;
	protected MessageFormat reqLogin_membershipFilter = null;

	protected String _adminGroupFilter;
	protected MessageFormat adminGroupFilter;

	protected String _readOnlyGroupFilter;
	protected MessageFormat readOnlyGroupFilter;

	protected String[] ldapAttrib;
	protected Path[] ebxUserPaths;

	protected String environmentPrefix;
	protected String environmentSuffix;
	protected Boolean autenticateWithEBXFirst;
	//	protected Boolean forcePropertyReload;

	protected String _usersInGroup;
	protected MessageFormat usersInGroup;
	protected Boolean implementsGetUsersInRole;
	protected String[] usersInGroupAttributeNames;
	protected String ldapVersion;

	public void setUserSearch(String _userSearch)
	{
		this._userSearch = _userSearch;
		if (_userSearch != null)
			this.userSearch = new MessageFormat(_userSearch);
	}
	public void setUserLogin(String _userLogin)
	{
		this._userLogin = _userLogin;
		if (_userLogin != null)
			this.userLogin = new MessageFormat(_userLogin);
	}
	public void setMembershipRole(String _membershipRole)
	{
		this._membershipRole = _membershipRole;
		if (_membershipRole != null)
			this.membershipRole = new MessageFormat(_membershipRole);
	}
	public void setMembershipFilter(String _membershipFilter)
	{
		this._membershipFilter = _membershipFilter;
		if (_membershipFilter != null)
			this.membershipFilter = new MessageFormat(_membershipFilter);
	}
	public void setReqLogin_role(String _reqLogin_role)
	{
		this._reqLogin_role = _reqLogin_role;
		if (_reqLogin_role != null)
			this.reqLogin_role = new MessageFormat(_reqLogin_role);
	}

	public void setUsersInGroup(String _usersInGroup)
	{
		this._usersInGroup = _usersInGroup;
		if (_usersInGroup != null)
			this.usersInGroup = new MessageFormat(_usersInGroup);
	}

	public void setAdminGroupFilter(String adminGroupFilter)
	{
		this._adminGroupFilter = adminGroupFilter;
		if (_adminGroupFilter != null)
			this.adminGroupFilter = new MessageFormat(_adminGroupFilter);
	}

	public void setReadOnlyGroupFilter(String readOnlyGroupFilter)
	{
		this._readOnlyGroupFilter = readOnlyGroupFilter;
		if (_readOnlyGroupFilter != null)
			this.readOnlyGroupFilter = new MessageFormat(_readOnlyGroupFilter);
	}

}
