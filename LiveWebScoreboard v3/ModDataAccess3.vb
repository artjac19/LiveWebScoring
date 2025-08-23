Imports System.Data.Common
Imports System.Data.OleDb
Imports System.Security.Cryptography.X509Certificates

Public Module ModDataAccess3
    Public Function ScoresXRunOrdHoriz(ByVal SanctionID As String, ByVal YearPkd As String, ByVal TName As String, ByVal selEvent As String, ByVal selDv As String, ByVal selRnd As String, ByVal RndsSlalomOffered As String, ByVal RndsTrickOffered As String, ByVal RndsJumpOffered As String, ByVal UseNOPS As Int16, ByVal UseTeams As Int16, ByVal FormatCode As String, ByVal DisplayMetric As Int16) As String
        Dim sReturn As String = ""
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sYrPkd As String = YearPkd
        Dim sPREventCode As String = ""
        Dim sSelEvent As String = selEvent
        Dim sSelDV As String = selDv
        Dim sSelRnd As String = selRnd
        Dim sTName As String = TName
        Dim sSkierName As String = ""
        Dim sMemberID As String = ""
        Dim sEventScoreDesc As String = ""
        Dim stmpMemberID As String = ""
        Dim i As Integer = 0
        Dim sDv As String = ""
        Dim sEventClass As String = ""
        Dim sEventClassIcon As String = ""
        Dim sEventGroup As String = ""
        Dim sTmpEventGroup As String = ""
        Dim sRnd As String = ""
        Dim sRunOrd As New StringBuilder
        Dim sSlalomHeader As String = ""
        Dim sTrickHeader As String = ""
        Dim sJumpHeader As String = ""
        Dim sLine As New StringBuilder
        Dim sRndsSlalomOffered As String = RndsSlalomOffered
        Dim sRndsTrickOffered As String = RndsTrickOffered
        Dim sRndsJumpOffered As String = RndsJumpOffered
        Dim sRndsOffered As String = ""
        Dim sHasVideo As String = ""
        Dim sTVidAvail As String = ""
        Dim sRankingScore As String = ""
        Dim sReadyForPlcmt As String = ""

        Dim sSql As String = ""
        Select Case selEvent
            Case "S"
                sPREventCode = "Slalom"
                sSql = "PrSlalomScoresByRunOrder"
                If sSelRnd = 0 Then
                    sRndsOffered = sRndsSlalomOffered
                    Dim compactClass As String = If(CInt(sRndsSlalomOffered) >= 3, " class=""compact""", "")
                    sLine.Append("<table" & compactClass & ">") '& sSlalomHeader) '& sSlalomDVHeader)
                    sSlalomHeader = "<thead><tr><th style=""background-color: #15274D; color: white; font-size: 0.7rem;"">SLALOM</th><th style=""background-color: #15274D; color: white; font-size: 0.7rem;"">Group / Div</th>"
                    For i = 1 To RndsSlalomOffered
                        If i <= 6 Then  ' Only show regular rounds, not runoffs
                            sSlalomHeader += "<th style=""background-color: #15274D; color: white; font-size: 0.7rem;"">Round " & i & "</th>"
                        End If
                    Next
                    ' Add runoff column if needed (this should be determined by data, but for now we'll let the data drive it)
                    ' sSlalomHeader += "<th style=""background-color: #15274D; color: white;"">Runoff</th>"
                    sLine.Append(sSlalomHeader & "</tr></thead>")
                Else
                    Dim compactClass As String = If(CInt(sRndsSlalomOffered) >= 3, " class=""compact""", "")
                    sLine.Append("<table" & compactClass & ">") '& sSlalomHeader) '& sSlalomDVHeader)
                    Dim roundText As String = If(sSelRnd = "25", "Runoff", "Round " & sSelRnd)
                    sLine.Append("<thead><tr><th style=""background-color: #15274D; color: white;"">SLALOM</th><th style=""background-color: #15274D; color: white;"">Group / Div</th><th style=""background-color: #15274D; color: white;"">Score " & roundText & "</th></tr></thead>")
                End If
            Case "T"
                sPREventCode = "Trick"
                sSql = "PrTrickScoresByRunOrder"
                If sSelRnd = 0 Then
                    sRndsOffered = sRndsTrickOffered
                    Dim compactClass As String = If(CInt(sRndsTrickOffered) >= 3, " class=""compact""", "")
                    sLine.Append("<table" & compactClass & ">") '& sTrickHeader) '& sTrickDVHeader)
                    sTrickHeader = "<thead><tr><th style=""background-color: #15274D; color: white; font-size: 0.7rem;"">TRICK</th><th style=""background-color: #15274D; color: white; font-size: 0.7rem;"">Group / Div</th>"
                    For i = 1 To RndsTrickOffered
                        If i <= 6 Then  ' Only show regular rounds, not runoffs
                            sTrickHeader += "<th style=""background-color: #15274D; color: white; font-size: 0.7rem;"">Round " & i & "</th>"
                        End If
                    Next
                    sLine.Append(sTrickHeader & "</tr></thead>")
                Else
                    Dim compactClass As String = If(CInt(sRndsTrickOffered) >= 3, " class=""compact""", "")
                    sLine.Append("<table" & compactClass & ">") '& sTrickHeader) '& sTrickDVHeader)
                    Dim roundText As String = If(sSelRnd = "25", "Runoff", "Round " & sSelRnd)
                    sLine.Append("<thead><tr><th style=""background-color: #15274D; color: white;"">TRICK</th><th style=""background-color: #15274D; color: white;"">Group / Div</th><th style=""background-color: #15274D; color: white;"">Score " & roundText & "</th></tr></thead>")
                End If
            Case "J"
                sPREventCode = "Jump"
                sSql = "PrJumpScoresByRunOrder"
                If sSelRnd = 0 Then
                    sRndsOffered = sRndsJumpOffered
                    Dim compactClass As String = If(CInt(sRndsJumpOffered) >= 3, " class=""compact""", "")
                    sLine.Append("<table" & compactClass & ">") '& sJumpHeader)  ' & sJumpDVHeader)
                    sJumpHeader = "<thead><tr><th style=""background-color: #15274D; color: white; font-size: 0.7rem;"">JUMP</th><th style=""background-color: #15274D; color: white; font-size: 0.7rem;"">Group / Div</th>"
                    For i = 1 To sRndsJumpOffered
                        If i <= 6 Then  ' Only show regular rounds, not runoffs
                            sJumpHeader += "<th style=""background-color: #15274D; color: white; font-size: 0.7rem;"">Round " & i & "</th>"
                        End If
                    Next
                    sLine.Append(sJumpHeader & "</tr></thead>")

                Else
                    Dim compactClass As String = If(CInt(sRndsJumpOffered) >= 3, " class=""compact""", "")
                    sLine.Append("<table" & compactClass & ">") '& sJumpHeader)  ' & sJumpDVHeader)
                    Dim roundText As String = If(sSelRnd = "25", "Runoff", "Round " & sSelRnd)
                    sLine.Append("<thead><tr><th style=""background-color: #15274D; color: white;"">JUMP</th><th style=""background-color: #15274D; color: white;"">Group / Div</th><th style=""background-color: #15274D; color: white;"">Score " & roundText & "</th></tr></thead>")
                End If
            Case Else  'Load all by default
                sPREventCode = "ALL"
        End Select
        i = 0
        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: GetRunOrder could not get connection string."
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim cmdRead As New OleDb.OleDbCommand
        cmdRead.CommandType = CommandType.StoredProcedure
        cmdRead.CommandText = sSql
        cmdRead.Parameters.Add("@InSanctionID", OleDb.OleDbType.VarChar)
        cmdRead.Parameters("@InSanctionID").Size = 6
        cmdRead.Parameters("@InSanctionID").Value = sSanctionID
        cmdRead.Parameters("@InSanctionID").Direction = ParameterDirection.Input

        '       cmdRead.Parameters.Add("@InEvCode", OleDb.OleDbType.VarChar)
        '       cmdRead.Parameters("@InEvCode").Size = 12
        '       cmdRead.Parameters("@InEvCode").Value = sPREventCode
        '       cmdRead.Parameters("@InEvCode").Direction = ParameterDirection.Input

        cmdRead.Parameters.Add("@InRnd", OleDb.OleDbType.Char)
        cmdRead.Parameters("@InRnd").Size = 1
        cmdRead.Parameters("@InRnd").Value = sSelRnd    '0 = All Rounds    sSelRnd
        cmdRead.Parameters("@InRnd").Direction = ParameterDirection.Input

        cmdRead.Parameters.Add("@InDV", OleDb.OleDbType.VarChar)
        cmdRead.Parameters("@InDV").Size = 3
        cmdRead.Parameters("@InDV").Value = sSelDV   'sDv
        cmdRead.Parameters("@InDV").Direction = ParameterDirection.Input

        cmdRead.Parameters.Add("@InGroup", OleDb.OleDbType.VarChar)
        cmdRead.Parameters("@InGroup").Size = 3
        cmdRead.Parameters("@InGroup").Value = "ALL"   'sEventGroup
        cmdRead.Parameters("@InGroup").Direction = ParameterDirection.Input

        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()
                            sSkierName = CStr(MyDataReader.Item("SkierName"))
                            If Not IsDBNull(MyDataReader.Item("DiV")) Then
                                sDv = CStr(MyDataReader.Item("DiV"))
                            Else
                                sDv = ""
                            End If

                            If Not IsDBNull(MyDataReader.Item("EventClass")) Then
                                sEventClass = MyDataReader.Item("EventClass")
                            Else
                                sEventClass = ""
                            End If

                            If Not IsDBNull(MyDataReader.Item("EventGroup")) Then
                                sEventGroup = MyDataReader.Item("EventGroup")
                            Else
                                sEventGroup = ""
                            End If

                            sMemberID = MyDataReader.Item("MemberID")
                            If Not IsDBNull(MyDataReader.Item("MemberID")) Then
                                sMemberID = MyDataReader.Item("MemberID")
                            Else
                                sMemberID = ""
                            End If

                            If Not IsDBNull(MyDataReader.Item("EventScoreDesc")) Then
                                sEventScoreDesc = MyDataReader.Item("EventScoreDesc")
                            Else
                                sEventScoreDesc = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("Round")) Then
                                sRnd = MyDataReader.Item("Round")
                            Else
                                sRnd = 0
                            End If
                            If Not IsDBNull(MyDataReader.Item("RankingScore")) Then
                                sRankingScore = MyDataReader.Item("RankingScore")
                            Else
                                sRankingScore = ""
                            End If
                            sHasVideo = ""
                            'ONLY for Trick - Show trick video flag if available- 
                            If selEvent = "T" Then
                                If Not IsDBNull(MyDataReader.Item("Pass1VideoURL")) Then
                                    sTVidAvail = "Y"
                                End If

                                If Not IsDBNull(MyDataReader.Item("Pass2VideoURL")) Then
                                    sTVidAvail = "Y"
                                End If
                                If sTVidAvail = "Y" Then
                                    sHasVideo = "<img src=""Images/Flag-green16.png"" alt=""Trick Video Available"" title=""Trick Video Available, Select skier on Entry List"" />"
                                End If
                            End If

                            sReadyForPlcmt = ""
                            If Not IsDBNull(MyDataReader.Item("ReadyForPlcmt")) Then
                                If MyDataReader.Item("ReadyForPlcmt") <> "Y" Then
                                    sReadyForPlcmt = "&nbsp;<span class=""class-logo class-x"" title=""NOT for placement"">X</span>"
                                End If
                            End If

                            If selRnd = 0 Then
                                Select Case sEventClass
                                    Case "C"
                                        sEventClassIcon = "<span class=""class-logo class-c"" title=""Class C"">C</span>"
                                    Case "E"
                                        sEventClassIcon = "<span class=""class-logo class-e"" title=""Class E"">E</span>"
                                    Case "L"
                                        sEventClassIcon = "<span class=""class-logo class-l"" title=""Class L"">L</span>"
                                    Case "R"
                                        sEventClassIcon = "<span class=""class-logo class-r"" title=""Class R"">R</span>"
                                End Select
                                If sTmpEventGroup = "" Then
                                    sTmpEventGroup = sEventGroup
                                    sLine.Append("<tr style=""background-color: #d6eded;""><td><b>Run Order</b></td><td colspan = " & sRndsOffered + 1 & "><b> Event Group = " & sEventGroup & "</b></td></tr>")
                                End If

                                If stmpMemberID = "" Then
                                    stmpMemberID = sMemberID ' first record in first pass
                                    sLine.Append("<tr><td><a runat=""server""  href=""Trecap?SID=" & sSanctionID & "&SY=" & sYrPkd & "&MID=" & stmpMemberID & "&DV=" & sDv & "&EV=" & sSelEvent & "&TN=" & sTName & "")
                                    Dim rankingDisplay As String = If(sRankingScore <> "", " <small>(RS: " & sRankingScore & ")</small>", "")
                                    sLine.Append("&FC=RO&FT=0&RP=" & sRnd & "&UN=0&UT=0&SN=" & sSkierName & """ ><b>" & sSkierName & "</b></a>" & rankingDisplay & sHasVideo & sReadyForPlcmt & "</td>")
                                    sLine.Append("<td><b> " & sDv & "</b></td>")
                                End If
                                If stmpMemberID = sMemberID Then
                                    i += 1
                                    If sRnd > i And sRnd < 25 Then  'If first score is in round 2 or greater - fill in earlier rounds as blanks (but not for runoffs)
                                        Do Until sRnd = i
                                            sLine.Append("<td></td>")
                                            i += 1
                                        Loop
                                    End If
                                    Select Case sRnd
                                        Case 1
                                            If sEventScoreDesc <> "" Then
                                                sLine.Append("<td>" & sEventClassIcon & " " & sEventScoreDesc & "</td>")
                                            Else
                                                sLine.Append("<td></td>")
                                            End If
                                      '                           sLine.Append("<tr><td class=""table-success"">" & sSkierName & "</td><td>" & sEventGroup & " / " & sDv & " / " & sEventClass & "</td><td>" & sEventScoreDesc & "</td>")
                                        Case 2
                                            If sEventScoreDesc <> "" Then
                                                sLine.Append("<td>" & sEventClassIcon & " " & sEventScoreDesc & "</td>")
                                            Else
                                                sLine.Append("<td></td>")
                                            End If
                                        Case 3
                                            If sEventScoreDesc <> "" Then
                                                sLine.Append("<td>" & sEventClassIcon & " " & sEventScoreDesc & "</td>")
                                            Else
                                                sLine.Append("<td></td>")
                                            End If
                                        Case 4
                                            If sEventScoreDesc <> "" Then
                                                sLine.Append("<td>" & sEventClassIcon & " " & sEventScoreDesc & "</td>")
                                            Else
                                                sLine.Append("<td></td>")
                                            End If
                                        Case 5
                                            If sEventScoreDesc <> "" Then
                                                sLine.Append("<td>" & sEventClassIcon & " " & sEventScoreDesc & "</td>")
                                            Else
                                                sLine.Append("<td></td>")
                                            End If
                                        Case 6
                                            If sEventScoreDesc <> "" Then
                                                sLine.Append("<td>" & sEventClassIcon & " " & sEventScoreDesc & "</td>")
                                            Else
                                                sLine.Append("<td></td>")
                                            End If
                                        Case 25 'runoff - append to existing score instead of new column
                                            ' Find the last <td> and append runoff data to it
                                            Dim lastTdIndex As Integer = sLine.ToString().LastIndexOf("</td>")
                                            If lastTdIndex > 0 Then
                                                sLine.Replace("</td>", "<br/><i>(Runoff: " & sEventScoreDesc & ")</i></td>", lastTdIndex, 5)
                                            End If
                                        Case 0  'error
                                            sLine.Append("<td>No Score</td>")
                                    End Select


                                Else 'New skier
                                    'fill in any empty <td></td> if skier did not ski all rounds
                                    If i < sRndsOffered Then
                                        Dim remainingRounds As Integer = sRndsOffered - i
                                        For j As Integer = 1 To remainingRounds
                                            sLine.Append("<td></td>")
                                        Next
                                    End If
                                    'Close out the line
                                    sLine.Append("</tr>")

                                    'Finished previous line - start new
                                    If sTmpEventGroup <> sEventGroup Then
                                        sLine.Append("<tr style=""background-color: #d6eded;""><td><b>Run Order</b></td><td colspan = " & sRndsOffered + 1 & "><b> Event Group = " & sEventGroup & "</b></td></tr>")
                                        sTmpEventGroup = sEventGroup
                                    End If
                                    stmpMemberID = sMemberID
                                    i = 1
                                    Select Case sEventClass
                                        Case "C"
                                            sEventClassIcon = "<span class=""class-logo class-c"" title=""Class C"">C</span>"
                                        Case "E"
                                            sEventClassIcon = "<span class=""class-logo class-e"" title=""Class E"">E</span>"
                                        Case "L"
                                            sEventClassIcon = "<span class=""class-logo class-l"" title=""Class L"">L</span>"
                                        Case "R"
                                            sEventClassIcon = "<span class=""class-logo class-r"" title=""Class R"">R</span>"
                                    End Select
                                    sLine.Append("<tr><td><a runat=""server""  href=""Trecap?SID=" & sSanctionID & "&SY=" & sYrPkd & "&MID=" & stmpMemberID & "&DV=" & sDv & "&EV=" & sSelEvent & "&TN=" & sTName & "")
                                    Dim rankingDisplay2 As String = If(sRankingScore <> "", " <small>(RS: " & sRankingScore & ")</small>", "")
                                    sLine.Append("&FC=RO&FT=0&RP=" & sRnd & "&UN=0&UT=0&SN=" & sSkierName & """ ><b>" & sSkierName & "</b></a>" & rankingDisplay2 & sHasVideo & sReadyForPlcmt & "</td>")
                                    sLine.Append("<td><b>" & sDv & "</b></td>")
                                    If sRnd > i And sRnd < 25 Then  'If first score is in round 2 or greater - fill in earlier rounds as blanks (but not for runoffs)
                                        Do Until sRnd = i
                                            sLine.Append("<td></td>")
                                            i += 1
                                        Loop
                                    End If
                                    If sEventScoreDesc <> "" Then
                                        sLine.Append("<td>" & sEventClassIcon & " " & sEventScoreDesc & "</td>")
                                    Else
                                        sLine.Append("<td></td>")
                                    End If
                                End If
                            Else 'only need score for selected round
                                Select Case sEventClass
                                    Case "C"
                                        sEventClassIcon = "<span class=""class-logo class-c"" title=""Class C"">C</span>"
                                    Case "E"
                                        sEventClassIcon = "<span class=""class-logo class-e"" title=""Class E"">E</span>"
                                    Case "L"
                                        sEventClassIcon = "<span class=""class-logo class-l"" title=""Class L"">L</span>"
                                    Case "R"
                                        sEventClassIcon = "<span class=""class-logo class-r"" title=""Class R"">R</span>"
                                End Select
                                sLine.Append("<tr><td width=""13%""><a runat=""server""  href=""Trecap?SID=" & sSanctionID & "&SY=" & sYrPkd & "&MID=" & stmpMemberID & "&DV=" & sDv & "&EV=" & sSelEvent & "&TN=" & sTName & "")
                                Dim rankingDisplay3 As String = If(sRankingScore <> "", " <small>(RS: " & sRankingScore & ")</small>", "")
                                sLine.Append("&FC=RO&FT=0&RP=" & sRnd & "&UN=0&UT=0&SN=" & sSkierName & """ ><b>" & sSkierName & "</b></a>" & rankingDisplay3 & sHasVideo & sReadyForPlcmt & "</td>")
                                If sEventScoreDesc <> "" Then
                                    sLine.Append("<td>" & sEventGroup & " / <b>" & sDv & "</b> </td><td>" & sEventClassIcon & " " & sEventScoreDesc & "</td></tr>")
                                Else
                                    sLine.Append("<td>" & sEventGroup & " / <b>" & sDv & "</b> </td><td></td></tr>")
                                End If
                            End If

                        Loop
                        ' Close the final row if we have data, then close table
                        If stmpMemberID <> "" Then
                            ' Fill remaining columns for last skier if needed (only for all rounds view)
                            If selRnd = 0 AndAlso i < sRndsOffered Then
                                Dim remainingRounds As Integer = sRndsOffered - i
                                For j As Integer = 1 To remainingRounds
                                    sLine.Append("<td></td>")
                                Next
                                sLine.Append("</tr>")
                            End If
                            ' For round-specific view, row is already closed in the Else block above
                        End If
                        sLine.Append("</table>")
                    Else 'No data
                        sLine.Append("<tr><td colspan=""" & (sRndsOffered + 2) & """>No Skiers Found</td></tr>")
                        sLine.Append("</table>")
                        sMsg = ""
                    End If
                End Using
            Catch ex As Exception
                sMsg = "No running order available"
                sErrDetails = sMsg & " " & ex.Message & " " & ex.StackTrace
            End Try
        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        Return sLine.ToString()
    End Function

    Friend Function LoadRecent(ByVal SanctionID As String) As String
        '   , ByVal YearPkd As String, ByVal TName As String, ByVal selEvent As String, ByVal selDv As String, ByVal selRnd As String, ByVal RndsSlalomOffered As String, ByVal RndsTrickOffered As String, ByVal RndsJumpOffered As String, ByVal UseNOPS As Int16, ByVal UseTeams As Int16, ByVal FormatCode As String, ByVal DisplayMetric As Int16
        Dim sText As String = ""
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sSkierName As String = ""
        Dim sSkierInsert As String = ""
        Dim sDV As String = ""
        Dim sEvent As String = ""
        Dim sEventClass As String = ""
        Dim sEventScoreDesc As String = ""
        Dim sEventGroup As String = ""
        Dim sNOPS As String = ""
        Dim sMemberID As String = ""
        Dim sInsertDate As String = ""
        Dim sInsertTime As String = ""
        Dim sInsertTimeSpan As TimeSpan = Nothing
        Dim sTmpMemberID As String = ""
        Dim sTmpRound As String = ""
        Dim sRound As String = ""
        Dim sPass As String = ""
        Dim sScore As String = ""
        Dim sBoatTime As String = ""
        Dim sNote As String = ""
        Dim sReride As String = "N"
        Dim sRerideReason As String = ""
        Dim sProtectedScore As String = ""
        Dim sBackColor As String = ""
        '        Dim sSQL As String = "Select top 5 SR.LastUpdateDate, SR.*, TR.SkierName "
        '        sSQL += " from SlalomRecap SR left join TourReg TR ON SR.MemberID = TR.MemberID where sanctionID = '" & sSanctionID & "'"
        '        sSQL += " order by sr.lastupdatedate desc "
        Dim sSQL As String = "PrGetRecentScores"
        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: GetRunOrder could not get connection string."
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim cmdRead As New OleDb.OleDbCommand
        cmdRead.CommandType = CommandType.StoredProcedure
        cmdRead.CommandText = sSQL
        cmdRead.Parameters.Add("@InSanctionID", OleDb.OleDbType.VarChar)
        cmdRead.Parameters("@InSanctionID").Size = 6
        cmdRead.Parameters("@InSanctionID").Value = sSanctionID
        cmdRead.Parameters("@InSanctionID").Direction = ParameterDirection.Input

        cmdRead.Parameters.Add("@InUseLastActive", OleDb.OleDbType.Boolean)
        cmdRead.Parameters("@InUseLastActive").Value = 0
        cmdRead.Parameters("@InUseLastActive").Direction = ParameterDirection.Input



        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()



                            sSanctionID = CStr(MyDataReader.Item("SanctionID"))
                            sSkierName = CStr(MyDataReader.Item("SkierName"))
                            sMemberID = CStr(MyDataReader.Item("MemberID"))
                            sDV = CStr(MyDataReader.Item("AgeGroup"))
                            If Not IsDBNull(MyDataReader.Item("EventScoreDesc")) Then
                                sEventScoreDesc = CStr(MyDataReader.Item("EventScoreDesc"))
                            Else
                                sEventScoreDesc = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("Event")) Then
                                sEvent = CStr(MyDataReader.Item("Event"))
                            Else
                                sEvent = ""
                            End If
                            Select Case sEvent
                                Case "Slalom"
                                    sEvent = "S"
                                Case "Trick"
                                    sEvent = "T"
                                Case "Jump"
                                    sEvent = "J"
                                Case Else
                                    sEvent = ""
                            End Select
                            If Not IsDBNull(MyDataReader.Item("EventClass")) Then
                                sEventClass = CStr(MyDataReader.Item("EventClass"))
                            Else
                                sEventClass = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("EventGroup")) Then
                                sEventGroup = CStr(MyDataReader.Item("EventGroup"))
                            Else
                                sEventGroup = ""
                            End If
                            sRound = CStr(MyDataReader.Item("Round"))
                            If Not IsDBNull(MyDataReader.Item("NOPSScore")) Then
                                sNOPS = CStr(MyDataReader.Item("NOPSScore"))
                            Else
                                sNOPS = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("InsertDate")) Then
                                sInsertDate = CStr(MyDataReader.Item("InsertDate").ToShortDateString())
                                sInsertTime = MyDataReader.Item("InsertDate").TimeOfDay.ToString()
                            Else
                                sInsertDate = ""
                            End If
                            'Have data - create display

                            If sText = "" Then
                                sText = "    <div Class=""container"">"
                                sText += "<div Class=""row"">"
                                sText += "    <div Class=""col-12 bg-primary text-white text-center"">"
                                sText += "Most Recent <span class=""bg-danger text-white"">UNOFFICIAL</span> Performances." & sInsertDate
                                sText += "   </div>"
                                sText += " </div>"
                                sText += "<div Class=""row"">"
                                sText += " <div class=""col-2"">Name</div><div class=""col-1"">Div</div><div class=""col-1"">Event</div><div class=""col-1"">Group</div><div class=""col-1"">Class</div><div class=""col-1"">Rnd</div><div class=""col-3"">Score</div><div class=""col-1"">Time</div>"
                            End If

                            sText += " <div class=""col-2"">" & sSkierName & "</div><div class=""col-1"">" & sDV & "</div><div class=""col-1"">" & sEvent & "</div><div class=""col-1"">" & sEventGroup & "</div><div class=""col-1"">" & sEventClass & "</div><div class=""col-1"">" & sRound & "</div><div class=""col-3"">" & sEventScoreDesc & "</div><div class=""col-1"">" & sInsertTime & "</div>"

                        Loop
                    Else
                        sMsg = "No Recent Scores<br>"

                    End If 'end of has rows
                End Using
            Catch ex As Exception
                sMsg += "<div Class=""row"">"
                sMsg += "    <div Class=""col-12 text-center"">"
                sMsg += "<b> Error at Load Recent </b>"
                sErrDetails = ex.Message & " " & ex.StackTrace & " <br>SQL= " & sSQL & "</br>" & sText
                ' IF DEBUG IS ON
                '   sMsg += "<br />" & sErrDetails
                'End If
                sMsg += "   </div>"
                sMsg += " </div>"

            Finally
                sText += "</div>"  'end of container
            End Try
        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        'sText += "</div>"  'End of container - if Finally is hit on successful record don't need this
        Return sText
    End Function

    Public Function LoadOnWaterSlalom(ByVal SanctionID As String) As String
        'AJAX partial page refresh - Automatic refresh based on timer set to 1.75 minutes (est slalom pass at 2 min.)
        'Allow user to set refresh timer from 1.75 to 3 minutes.
        Dim sText As String = ""
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sSkierName As String = ""
        Dim sDV As String = ""
        Dim sEventClass As String = ""
        Dim sMemberID As String = ""
        Dim sTmpMemberID As String = ""
        Dim sTmpRound As String = ""
        Dim sRound As String = ""
        Dim sPass As String = ""
        Dim sScore As String = ""
        Dim sBoatTime As String = ""
        Dim sNote As String = ""
        Dim sReride As String = "N"
        Dim sRerideReason As String = ""
        Dim sProtectedScore As String = ""
        Dim sInsertDate As String = ""
        Dim sInsertTime As String = ""
        Dim sBackColor As String = ""
        '        Dim sSQL As String = "Select top 5 SR.LastUpdateDate, SR.*, TR.SkierName "
        '        sSQL += " from SlalomRecap SR left join TourReg TR ON SR.MemberID = TR.MemberID where sanctionID = '" & sSanctionID & "'"
        '        sSQL += " order by sr.lastupdatedate desc "
        Dim sSQL As String = "SELECT top 10 SR.MemberID, SR.LastUpdateDate, SR.SanctionID, TR.SkierName,  SR.AgeGroup, "
        sSQL += " SR.[round], SR.SkierRunNum As Pass, SR.Score, SR.Note, SR.Reride, SR.RerideReason, SR.ProtectedScore, SR.InsertDate "
        sSQL += " From LiveWebScoreboard.dbo.SlalomRecap SR "
        sSQL += " Left Join (Select distinct SkierName, SanctionID, MemberID from LiveWebScoreboard.dbo.TourReg where sanctionID = '" & sSanctionID & "') As TR "
        sSQL += " On TR.sanctionID = SR.SanctionID And SR.MemberID = TR.MemberID "
        sSQL += " Where SR.SanctionId = '" & sSanctionID & "' "
        sSQL += " and LastUpdateDate > DateAdd(Minute, -10, GetDate())"
        sSQL += " order by SR.LastUpdateDate desc, SR.MemberID  "

        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: OnWaterSlalom could not get connection string."
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try

        'Get the data - loop through and build the display using <div>s
        'If reride - put reride details on indented second line.
        'Loop until memberID changes.
        'Can computer sending new information be identified.  
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim cmdRead As New OleDb.OleDbCommand
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False

        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.CommandText = sSQL
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()

                            sSanctionID = CStr(MyDataReader.Item("SanctionID"))
                            sSkierName = CStr(MyDataReader.Item("SkierName"))
                            sSkierName = Replace(sSkierName, "'", "''")
                            sMemberID = CStr(MyDataReader.Item("MemberID"))
                            sDV = CStr(MyDataReader.Item("AgeGroup"))
                            sScore = CStr(MyDataReader.Item("Score"))
                            '    sScoreProtected = CStr(MyDataReader.Item("EventClass"))
                            sRound = CStr(MyDataReader.Item("Round"))
                            sPass = CStr(MyDataReader.Item("Pass"))
                            sNote = CStr(MyDataReader.Item("Note"))
                            sReride = CStr(MyDataReader.Item("Reride"))
                            If Not IsDBNull(MyDataReader.Item("InsertDate")) Then
                                sInsertDate = CStr(MyDataReader.Item("InsertDate").ToShortDateString())
                                sInsertTime = MyDataReader.Item("InsertDate").TimeOfDay.ToString()
                            Else
                                sInsertDate = ""
                                sInsertTime = ""
                            End If
                            sBackColor = ""
                            If IsDBNull(MyDataReader.Item("ProtectedScore")) Then
                                sProtectedScore = "N/A"
                            Else
                                sProtectedScore = CStr(MyDataReader.Item("ProtectedScore"))
                            End If
                            If sReride = "Y" Then
                                If sProtectedScore = "0.0" Then
                                    sBackColor = "bg-danger text-dark"
                                Else
                                    sBackColor = "bg-warning text-dark"
                                End If
                            End If
                            If IsDBNull(MyDataReader.Item("RerideReason")) Then
                                sRerideReason = "N/A"
                            Else
                                sRerideReason = CStr(MyDataReader.Item("RerideReason"))
                            End If

                            'Have data - create display
                            If sTmpMemberID = "" Then 'do this once on first record
                                ' Set header text for onWaterHeaderText in JavaScript
                                sText = "<script>document.getElementById('onWaterHeaderText').textContent = 'Most recent slalom performance on " & sInsertDate & "';</script>"
                                sText += "    <div Class=""container"">"

                                sTmpMemberID = sMemberID
                                sTmpRound = sRound
                                sText += "<div Class=""row"">"
                                sText += "    <div Class=""col-12 text-black "">"
                                sText += " <b>" & sSkierName & "</b> &nbsp; " & sDV & " &nbsp; Round: " & sRound
                                sText += "   </div>"
                                sText += " </div>"
                            End If

                            If sTmpMemberID = sMemberID And sTmpRound = sRound Then
                                sText += "<div Class=""row mb-1"">"
                                sText += "<div Class=""col-2 " & sBackColor & """>"
                                sText += "Pass: " & sPass & " "
                                sText += "</div>"
                                sText += "<div Class=""col-2"">"
                                sText += sScore
                                sText += "</div>"
                                sText += "<div Class=""col-8"">"
                                sText += sNote & " " & sInsertTime
                                sText += "</div>"
                                sText += "        </div>"
                            Else
                                'Original skier performances listed. Don't display next skier
                                Exit Do
                            End If
                            If sReride = "Y" Then
                                sText += "            <div Class=""row"">"
                                sText += "        <div Class=""col-12 " & sBackColor & " text-center "">"
                                sText += "Pass:&nbsp;" & sPass & "&nbsp;Protected Score: " & sProtectedScore & " &nbsp; Reride Reason: " & sRerideReason
                                sText += "        </div>"
                                sText += "        </div>"
                            End If
                        Loop
                    Else
                        '                       sText += "<div Class=""row"">"
                        '                       sText += "    <div Class=""col-12 text-center"">"
                        '                       sText += " No Recent Slalom Scores "
                        '                       sText += "   </div>"
                        '                       sText += " </div>"
                        sMsg = "No Recent Slalom Scores<br>"

                    End If 'end of has rows
                End Using
            Catch ex As Exception
                sMsg += "<div Class=""row"">"
                sMsg += "    <div Class=""col-12 text-center"">"
                sMsg += "<b> Error at LoadOnWaterSlalom </b>"
                sErrDetails = ex.Message & " " & ex.StackTrace & " <br>SQL= " & sSQL & "</br>" & sText
                ' IF DEBUG IS ON
                '   sMsg += "<br />" & sErrDetails
                'End If
                sMsg += "   </div>"
                sMsg += " </div>"

            Finally
                sText += "</div>"  'end of container
            End Try
        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        'sText += "</div>"  'End of container - if Finally is hit on successful record don't need this
        Return sText
    End Function
    Public Function LoadOnWaterTrick(ByVal SanctionID As String) As String
        Dim sReturn As String = ""
        Dim sSanctionID As String = SanctionID
        Dim SQL As String = ""
        SQL = "SELECT top 4 MemberID, Insertdate, SanctionID, SkierName, AgeGroup,EventClass, EventScore, Round, EventScoreDesc from LiveWebScoreboard.dbo.vTrickResults "
        SQL += " Where SanctionID ='" & sSanctionID & "' "
        SQL += " and LastUpdateDate > DateAdd(Minute, -10, GetDate())"
        SQL += "  ORDER BY insertdate desc"

        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sMemberID As String = ""
        Dim sTmpMemberID As String = ""
        Dim sTmpRound As String = ""
        Dim sPass1URL As String = ""
        Dim sPass2URL As String = ""
        Dim sEvent As String = ""
        Dim sEventScore As String = ""
        Dim sRound As String = ""
        Dim sEventScoreDesc As String = ""
        Dim sPassNum As String = "0"
        Dim sConn As String = ""
        Dim sSkierName As String = ""
        Dim sAgeGroup As String = ""
        Dim sInsertDate As String = ""
        Dim sInsertTime As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: IndivTrickResults could not get connection string."
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim sEventClass As String = ""
        Dim sLine As String = ""
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim sTableWidth As String = "100%"
        Dim sText As String = ""
        Dim sTSB As New StringBuilder

        Dim cmdRead As New OleDb.OleDbCommand
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.CommandText = SQL
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()

                            sSanctionID = CStr(MyDataReader.Item("SanctionID"))
                            sSkierName = CStr(MyDataReader.Item("SkierName"))
                            sMemberID = CStr(MyDataReader.Item("MemberID"))
                            sAgeGroup = CStr(MyDataReader.Item("AgeGroup"))
                            sEventClass = CStr(MyDataReader.Item("EventClass"))
                            sEventScore = CStr(MyDataReader.Item("EventScore"))
                            sRound = CStr(MyDataReader.Item("Round"))
                            sEventScoreDesc = CStr(MyDataReader.Item("EventScoreDesc"))


                            If Not IsDBNull(MyDataReader.Item("InsertDate")) Then
                                sInsertDate = CStr(MyDataReader.Item("InsertDate").ToShortDateString())
                                sInsertTime = MyDataReader.Item("InsertDate").TimeOfDay.ToString()
                            Else
                                sInsertDate = ""
                                sInsertTime = ""
                            End If

                            If sTmpMemberID = "" Then
                                sTmpMemberID = sMemberID
                                sTmpRound = sRound
                                ' Set header text for onWaterHeaderText in JavaScript  
                                sTSB.Append("<script>document.getElementById('onWaterHeaderText').textContent = 'Most recent trick performance on " & sInsertDate & "';</script>")
                                sTSB.Append("    <div Class=""container"">")
                                sTSB.Append("<div Class=""row"">")
                                sTSB.Append("    <div Class=""col-12 text-black "">")
                                sTSB.Append(" <b>" & sSkierName & "</b> &nbsp; " & sAgeGroup & " &nbsp; Round: " & sRound)
                                sTSB.Append("   </div>")
                                sTSB.Append(" </div>")
                            End If
                            If sTmpMemberID = sMemberID And sTmpRound = sRound Then
                                sTSB.Append("<div Class=""row mb-1"">")
                                sTSB.Append("<div Class=""col-8"">")
                                sTSB.Append(sEventScoreDesc & " " & sInsertTime)
                                sTSB.Append("</div>")
                                sTSB.Append("        </div>")
                                '                           sTSB.Append("<tr><td><td>&nbsp;</td>" & sEventScore & "&nbsp;</td></tr>")
                            Else
                                Exit Do
                            End If
                        Loop
                    Else
                        '                        sTSB.Append("<thead><tr Class=""table-primary bg-primary""><td colspan=""5"">Most Recent <span class=""bg-danger text-white"">UNOFFICIAL</span> Performance Details</td></tr>")
                        '                        sTSB.Append("<tr><td colspan=""5"">No Recent Trick Scores</td></tr>")
                        sMsg = "No Recent Trick Scores<br>"
                    End If 'end of has rows
                End Using
            Catch ex As Exception
                sMsg += "Error: Can't retrieve Trick Scores"
                sErrDetails = ex.Message & " " & ex.StackTrace & "<br>SQL = " & SQL
            End Try
        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        sText = sTSB.ToString() & "</div>"
        Return sText

    End Function
    Public Function LoadOnWaterJump(ByVal SanctionID As String) As String
        Dim myStringBuilder As New StringBuilder("")
        Dim sText As String = ""
        Dim SQLsb As New StringBuilder("")
        Dim sSQL As String = ""
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sSkierName As String = ""
        Dim sDV As String = ""
        Dim sEventClass As String = ""
        Dim sMemberID As String = ""
        Dim sTmpMemberID As String = ""
        Dim sTmpRound As String = ""
        Dim sRound As String = ""
        Dim sPass As String = ""
        Dim sResults As String = ""
        Dim sScoreFeet As String = ""
        Dim sScoreMeters As String = ""
        Dim sNote As String = ""
        Dim sReride As String = ""
        Dim sRerideReason As String = ""
        Dim sProtectedScore As String = ""
        Dim sInsertDate As String = ""
        Dim sInsertTime As String = ""
        Dim sBackColor As String = ""


        SQLsb.Append("SELECT top 10 JR.MemberID, JR.LastUpdateDate, JR.SanctionID, TR.SkierName, JR.AgeGroup, ")
        SQLsb.Append(" JR.[round], JR.PassNum As Pass, JR.Results, JR.ScoreFeet, JR.ScoreMeters, JR.Note, JR.Reride, JR.RerideReason, JR.ScoreProt ")
        SQLsb.Append(", JR.RerideIfBest, JR.RerideCanImprove, JR.InsertDate ")
        SQLsb.Append(" From LiveWebScoreboard.dbo.JumpRecap JR ")
        SQLsb.Append(" Left Join (Select distinct SkierName, SanctionID, MemberID from LiveWebScoreboard.dbo.TourReg where sanctionID = '" & sSanctionID & "') ")
        SQLsb.Append(" as TR On JR.sanctionID = TR.SanctionID And JR.MemberID = TR.MemberID ")
        SQLsb.Append(" Where TR.SanctionId = '" & sSanctionID & "' ") ' following has reride  and [round] <> 25 and TR.MemberID = '200149011' "
        SQLsb.Append(" and LastUpdateDate > DateAdd(Minute, -10, GetDate())")
        SQLsb.Append(" order by LastUpdateDate desc ")
        sSQL = SQLsb.ToString

        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: OnWaterJump could not get connection string. " &
                sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try

        'Get the data - loop through and build the display using <div>s
        'If reride - put reride details on  second line.
        'Loop until memberID changes.
        'Can computer sending new information be identified.  
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim cmdRead As New OleDb.OleDbCommand
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False

        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.CommandText = sSQL
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()

                            sSanctionID = CStr(MyDataReader.Item("SanctionID"))
                            sSkierName = CStr(MyDataReader.Item("SkierName"))
                            sMemberID = CStr(MyDataReader.Item("MemberID"))
                            sDV = CStr(MyDataReader.Item("AgeGroup"))
                            sRound = CStr(MyDataReader.Item("Round"))
                            sPass = CStr(MyDataReader.Item("Pass"))
                            sResults = MyDataReader.Item("Results")
                            If IsDBNull(MyDataReader.Item("ScoreFeet")) Then
                                sScoreFeet = "0"
                            Else
                                sScoreFeet = CStr(MyDataReader.Item("ScoreFeet"))
                            End If
                            If IsDBNull(MyDataReader.Item("ScoreMeters")) Then
                                sScoreMeters = "0"
                            Else
                                sScoreMeters = CStr(MyDataReader.Item("ScoreMeters"))
                            End If
                            If IsDBNull(MyDataReader.Item("Note")) Then
                                sNote = ""
                            Else
                                sNote = CStr(MyDataReader.Item("Note"))
                            End If

                            sReride = CStr(MyDataReader.Item("Reride"))
                            sBackColor = ""
                            If IsDBNull(MyDataReader.Item("ScoreProt")) Then
                                sProtectedScore = "N/A"
                            Else
                                sProtectedScore = CStr(MyDataReader.Item("ScoreProt"))
                            End If
                            If sReride = "Y" Then
                                If sProtectedScore = "0.0" Then
                                    sBackColor = "bg-danger text-dark"
                                Else
                                    sBackColor = "bg-warning text-dark"
                                End If
                            End If
                            If IsDBNull(MyDataReader.Item("RerideReason")) Then
                                sRerideReason = "N/A"
                            Else
                                sRerideReason = CStr(MyDataReader.Item("RerideReason"))
                            End If
                            If Not IsDBNull(MyDataReader.Item("InsertDate")) Then
                                sInsertDate = CStr(MyDataReader.Item("InsertDate").ToShortDateString())
                                sInsertTime = MyDataReader.Item("InsertDate").TimeOfDay.ToString()
                            Else
                                sInsertDate = ""
                                sInsertTime = ""
                            End If
                            'Have data
                            If sTmpMemberID = "" Then  'first record - build header, display name
                                ' Set header text for onWaterHeaderText in JavaScript
                                myStringBuilder.Append("<script>document.getElementById('onWaterHeaderText').textContent = 'Most recent jump performance on " & sInsertDate & "';</script>")
                                myStringBuilder.Append("    <div Class=""container"">")
                                sTmpRound = sRound
                                sTmpMemberID = sMemberID
                                myStringBuilder.Append("<div Class=""row"">")
                                myStringBuilder.Append("    <div Class=""col-12 text-black "">")
                                myStringBuilder.Append(" <b>" & sSkierName & "</b> &nbsp; " & sDV & " &nbsp; Round: " & sRound)
                                myStringBuilder.Append("   </div>")
                                myStringBuilder.Append(" </div>")
                            End If
                            If sTmpMemberID = sMemberID And sTmpRound = sRound Then
                                myStringBuilder.Append("<div Class=""row mb-1"">")
                                myStringBuilder.Append("<div Class=""col-2 " & sBackColor & """>")
                                myStringBuilder.Append("Pass: " & sPass & " ")
                                myStringBuilder.Append("</div>")
                                myStringBuilder.Append("<div Class=""col-2"">")
                                myStringBuilder.Append(sResults)
                                myStringBuilder.Append("</div>")
                                myStringBuilder.Append("<div Class=""col-2"">")
                                myStringBuilder.Append(sScoreFeet & "F " & sScoreMeters & "M")
                                myStringBuilder.Append("</div>")
                                myStringBuilder.Append("<div Class=""col-6"">")
                                myStringBuilder.Append(sNote & " " & sInsertTime)
                                myStringBuilder.Append("</div>")
                                myStringBuilder.Append(" </div>")
                            Else  'New skier don't display
                                Exit Do
                            End If
                            If sReride = "Y" Then
                                myStringBuilder.Append(" <div Class=""row"">")
                                myStringBuilder.Append("<div Class=""col-12 " & sBackColor & " text-center "">")
                                myStringBuilder.Append("Pass:&nbsp;" & sPass & "&nbsp;Protected Score: " & sProtectedScore & " &nbsp; Reride Reason: " & sRerideReason)
                                myStringBuilder.Append(" </div>")
                                myStringBuilder.Append(" </div>")
                            End If
                        Loop
                    Else
                        '                        myStringBuilder.Append("<div Class=""row"">")
                        '                        myStringBuilder.Append("    <div Class=""col-12 text-center"">")
                        '                        myStringBuilder.Append(" No Recent Jump Scores ")
                        '                        myStringBuilder.Append("   </div>")
                        '                        myStringBuilder.Append(" </div>")
                        sMsg = "No Recent Jump Scores<br>"
                    End If 'end of has rows
                End Using
            Catch ex As Exception
                sMsg += "<div Class=""row"">"
                sMsg += "    <div Class=""col-12 text-center"">"
                sMsg += "<b> Error at LoadOnWaterSlalom </b>"
                sErrDetails = "</br>" & ex.Message & " " & ex.StackTrace & " <br>SQL= " & sSQL & "</br>" & sText
                'IF DEBUG IS ON THEN
                '      sMsg += sErrDetails
                '      End if
                sMsg += "   </div>"
                sMsg += " </div>"
            Finally
                myStringBuilder.Append("</div>")  'end of container
            End Try
        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        sText = myStringBuilder.ToString
        Return sText
    End Function



    Public Function LBGetRndScores(ByVal SanctionID As String, ByVal MemberID As String, ByVal selEvent As String, ByVal selDv As String, ByVal selRnd As String, ByVal BestRnd As String, ByVal rndsSlalomOffered As String, ByVal rndsTrickOffered As String, ByVal rndsJumpOffered As String, ByVal sNopsScore As String) As String
        'Get skiers by division in order of score desc
        'If all divisions are chosen display each round score in each event in horizontal row
        'If a specific round is selected - display that round details ignoring best round
        'if rnd = 0 then <td>sRnd1score</td><td>sRnd2Score</td> etc
        'if rnd > 0 then <td colspan="sRndsThisEvent"> Buoys NOPS EventScoreDetail Time
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sMemberID As String = MemberID
        Dim sTmpMemberID As String = ""
        Dim sAgeGroup As String = ""
        Dim sDV As String = ""
        Dim sTmpDV As String = ""
        Dim sSelDv As String = selDv  'AgeGroup/Div selected as a filter
        Dim sTmpAgeGroup As String = ""
        Dim sSelRnd As String = selRnd      'Round selected as a filter.
        Dim sBestRnd As String = BestRnd  'Round in which skier scored his best performance
        Dim sSelEvent As String = selEvent
        Dim sEventClass As String = ""
        Dim sEventClassIcon As String = ""
        Dim sTmpEventClass As String = ""
        Dim sTmpEvent As String = ""
        Dim sEventScore As String = ""
        Dim sTmpEventScore As String = ""
        Dim TmpMemberID As String = ""
        Dim TmpEventScore As String = ""
        Dim sNOPS As String = False ' database value for nops
        Dim sSNops As String = ""
        Dim sTNops As String = ""
        Dim sJNops As String = ""
        Dim sRnd As String = ""
        Dim sRndsThisEvent As String = ""
        Dim sRndsSlalomOffered As String = rndsSlalomOffered
        Dim sRndsTrickOffered As String = rndsTrickOffered
        Dim sRndsJumpOffered As String = rndsJumpOffered
        Dim sSlalomHeader As String = ""
        Dim sTrickHeader As String = ""
        Dim sJumpHeader As String = ""
        Dim sCols2Make As String = ""
        If sSelRnd = 0 Then
            sCols2Make = rndsSlalomOffered
            If sRndsTrickOffered > sCols2Make Then sCols2Make = sRndsTrickOffered
            If sRndsJumpOffered > sCols2Make Then sCols2Make = sRndsJumpOffered
        Else
            sCols2Make = "4"  'ADJUST THIS TO MATCH ONE ROUND FORMAT
        End If
        Dim sEventScoreDesc As String = ""
        Dim sEventScoreDescMetric As String = ""
        Dim sEventScoreDescImperial As String = ""
        Dim sEventScoreToShow As String = ""
        Dim sIWWFGroups As String = ""
        Dim sTime As String = ""
        Dim i As Int16 = 0
        Dim j As Int16 = 0
        Dim sTmpRow As New StringBuilder
        Dim sSQL As String = ""
        Dim sSBSql As New StringBuilder
        Select Case sSelEvent
            Case "Slalom"
                sSBSql.Append(" select Memberid, [Round], NopsScore, AgeGroup as Div, EventClass, CAST(Score AS CHAR) AS Buoys, TRIM(CAST(FinalPassScore AS CHAR)) + ' @ ' + TRIM(CAST(FinalSpeedMph AS CHAR)) + 'mph '")
                sSBSql.Append(" + TRIM(FinalLenOff) + ' (' + TRIM(CAST(FinalSpeedKph AS CHAR)) + 'kph ' + TRIM(FinalLen) + 'm)' AS EventScoreDesc, ")
                sSBSql.Append(" TRIM(CAST(FinalPassScore AS CHAR)) + ' @ ' + TRIM(CAST(FinalSpeedKph AS CHAR)) + 'kph ' + TRIM(FinalLen) + 'm' AS EventScoreDescMetric,")
                sSBSql.Append(" TRIM(CAST(FinalPassScore AS CHAR)) + ' @ ' + TRIM(CAST(FinalSpeedMph AS CHAR)) + 'mph ' + TRIM(FinalLenOff) AS EventScoreDescImperial ")
                sSBSql.Append(" FROM LiveWebScoreboard.dbo.SlalomScore where sanctionID = ? and MemberID = ? and AgeGroup = ?  and [Round] <> 25")
                If sSelRnd <> 0 Then sSBSql.Append(" and Round = ? ")

            Case "Trick"

                sSBSql.Append(" Select SanctionID, MemberID,AgeGroup as Div, EventClass,  [Round], NopsScore, Score AS EventScore, ")
                sSBSql.Append(" Trim(CAST(Score As Char)) + ' POINTS (P1:' + TRIM(CAST(ScorePass1 AS CHAR)) + ' P2:' + TRIM(CAST(ScorePass2 AS CHAR)) + ')' AS EventScoreDesc ")
                sSBSql.Append(" From LiveWebScoreboard.dbo.TrickScore Where SanctionID = ? and MemberID = ? and AgeGroup = ?  and [Round] <> 25")
                If sSelRnd <> 0 Then sSBSql.Append(" and Round = ? ")

            Case "Jump"
                sSBSql.Append("Select SanctionID, memberid, AgeGroup as Div, EventClass,  [Round], NopsScore, TRIM(cast(ScoreFeet As Char) + 'F ' + Cast(ScoreMeters AS CHAR) + 'M') AS EventScoreDesc, ")
                sSBSql.Append(" ScoreFeet, ScoreMeters, InsertDate from LiveWebScoreboard.dbo.JumpScore where SanctionID = ? and MemberID = ? and AgeGroup = ? and [Round] <> 25")
                If sSelRnd <> 0 Then sSBSql.Append(" and Round = ? ")

            Case "Overall"
                sMsg = "Overall not available"
                Return sMsg
                Exit Function
            Case Else
                sMsg = "Event out of range"
                sMsg = "Overall not available"
                Return sMsg
                Exit Function
        End Select
        sSQL = sSBSql.ToString()
        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: LBGetRndScores could not get connection string."
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim cmdRead As New OleDb.OleDbCommand
        cmdRead.CommandType = CommandType.Text
        cmdRead.CommandText = sSQL
        cmdRead.Parameters.Add("@InSanctionID", OleDb.OleDbType.VarChar)
        cmdRead.Parameters("@InSanctionID").Size = 6
        cmdRead.Parameters("@InSanctionID").Value = sSanctionID
        cmdRead.Parameters("@InSanctionID").Direction = ParameterDirection.Input

        cmdRead.Parameters.Add("@InMemID", OleDb.OleDbType.Char)
        cmdRead.Parameters("@InMemID").Size = 9
        cmdRead.Parameters("@InMemID").Value = sMemberID
        cmdRead.Parameters("@InMemID").Direction = ParameterDirection.Input

        cmdRead.Parameters.Add("@InDV", OleDb.OleDbType.VarChar)
        cmdRead.Parameters("@InDV").Size = 3
        cmdRead.Parameters("@InDV").Value = sSelDv   'skier's division from previous query.  NOT from drop list
        cmdRead.Parameters("@InDV").Direction = ParameterDirection.Input

        If sSelRnd <> 0 Then
            cmdRead.Parameters.Add("@InRnd", OleDb.OleDbType.Char)
            cmdRead.Parameters("@InRnd").Size = 1
            cmdRead.Parameters("@InRnd").Value = sSelRnd
            cmdRead.Parameters("@InRnd").Direction = ParameterDirection.Input
        End If


        '        cmdRead.Parameters.Add("@InEvCode", OleDb.OleDbType.VarChar)
        '        cmdRead.Parameters("@InEvCode").Size = 12
        '        cmdRead.Parameters("@InEvCode").Value = sSelEvent
        '        cmdRead.Parameters("@InEvCode").Direction = ParameterDirection.Input

        '        cmdRead.Parameters.Add("@InGroup", OleDb.OleDbType.VarChar)
        '        cmdRead.Parameters("@InGroup").Size = 3
        '    cmdRead.Parameters("@InGroup").Value = selDv   'sEventGroup
        '    cmdRead.Parameters("@InGroup").Direction = ParameterDirection.Input

        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()
                            If Not IsDBNull(MyDataReader.Item("DiV")) Then
                                sDV = CStr(MyDataReader.Item("DiV"))
                            Else
                                sDV = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("EventClass")) Then
                                sEventClass = MyDataReader.Item("EventClass")
                            Else
                                sEventClass = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("Round")) Then
                                sRnd = CStr(MyDataReader.Item("Round"))
                            Else
                                sRnd = "N/A"
                            End If
                            If sSelEvent <> "Overall" Then 'S,T,J fields

                                If Not IsDBNull(MyDataReader.Item("EventScoreDesc")) Then
                                    sEventScoreDesc = CStr(MyDataReader.Item("EventScoreDesc"))
                                Else
                                    sEventScoreDesc = "N/A"
                                End If

                                If Not IsDBNull(MyDataReader.Item("NopsScore")) Then
                                    sNOPS = CStr(MyDataReader.Item("NopsScore"))
                                Else
                                    sNOPS = "N/A"
                                End If
                            Else 'Overall Fields
                                If Not IsDBNull(MyDataReader.Item("SlalomNopsScore")) Then
                                    sSNops = CStr(MyDataReader.Item("SlalomNopsScore"))
                                Else
                                    sSNops = "N/A"
                                End If
                                If Not IsDBNull(MyDataReader.Item("TrickNopsScore")) Then
                                    sTNops = CStr(MyDataReader.Item("TrickNopsScore"))
                                Else
                                    sTNops = "N/A"
                                End If
                                If Not IsDBNull(MyDataReader.Item("JumpNopsScore")) Then
                                    sJNops = CStr(MyDataReader.Item("JumpNopsScore"))
                                Else
                                    sJNops = "N/A"
                                End If
                            End If
                            'FOR SLALOM EVENT ONLY - DISPLAY IMPERIAL OR METRIC BASED ON AGE OR IWWF DIVISION
                            If sSelEvent = "Slalom" Then

                                If Not IsDBNull(MyDataReader.Item("EventScoreDescMetric")) Then
                                    sEventScoreDescMetric = MyDataReader.Item("EventScoreDescMetric")
                                Else
                                    sEventScoreDescMetric = "N/A"
                                End If
                                If Not IsDBNull(MyDataReader.Item("EventScoreDescImperial")) Then
                                    sEventScoreDescImperial = MyDataReader.Item("EventScoreDescImperial")
                                Else
                                    sEventScoreDescImperial = "N/A"
                                End If

                                sEventScoreToShow = ""
                                Select Case sDV
                                    Case "OM", "OW", "MM", "MW"
                                        sEventScoreToShow = sEventScoreDescMetric
                                End Select
                                sIWWFGroups = Left(sDV, 1)
                                Select Case sIWWFGroups
                                    Case "Y", "J", "I", "S", "L"
                                        sEventScoreToShow = sEventScoreDescMetric
                                End Select
                                If sEventScoreToShow = "" Then
                                    sEventScoreToShow = sEventScoreDescImperial
                                End If
                                sEventScoreDesc = sEventScoreToShow
                            End If

                            If sSelRnd = 0 Then 'including all rounds
                                i += 1 'Round 1 column
                                If sRnd > i Then  'If first score is in round 2 or greater - fill in earlier rounds as blanks
                                    Do Until sRnd = i
                                        sTmpRow.Append("<td></td>")
                                        i += 1
                                    Loop
                                End If
                                Select Case sEventClass
                                    Case "C"
                                        sEventClassIcon = "<span class=""class-logo class-c"" title=""Class C"">C</span>"
                                    Case "E"
                                        sEventClassIcon = "<span class=""class-logo class-e"" title=""Class E"">E</span>"
                                    Case "L"
                                        sEventClassIcon = "<span class=""class-logo class-l"" title=""Class L"">L</span>"
                                    Case "R"
                                        sEventClassIcon = "<span class=""class-logo class-r"" title=""Class R"">R</span>"
                                End Select
                                Select Case sRnd 'get the data available for the specified event, Group, DV, and skier
                                    Case 1
                                        If sBestRnd = sRnd Then 'highlight the best round
                                            sTmpRow.Append("<td>" & sEventClassIcon & " <b>" & sEventScoreDesc & "</b></td>")
                                            '     sTmpRow.Append("<td class=""table-warning""><b>" & sEventScoreDesc & "</b></td>")
                                        Else
                                            sTmpRow.Append("<td>" & sEventClassIcon & " " & sEventScoreDesc & "</td>")   'sRnd1Score = sEventScoreDesc  'sR1=true
                                        End If
                                    Case 2
                                        If sBestRnd = sRnd Then 'highlight the best round
                                            sTmpRow.Append("<td>" & sEventClassIcon & " <b>" & sEventScoreDesc & "</b></td>")
                                        Else
                                            sTmpRow.Append("<td>" & sEventClassIcon & " " & sEventScoreDesc & "</td>")   'sRnd1Score = sEventScoreDesc  'sR1=true
                                        End If
                                    Case 3
                                        If sBestRnd = sRnd Then 'highlight the best round
                                            sTmpRow.Append("<td>" & sEventClassIcon & " <b>" & sEventScoreDesc & "</b></td>")
                                        Else
                                            sTmpRow.Append("<td>" & sEventClassIcon & " " & sEventScoreDesc & "</td>")   'sRnd1Score = sEventScoreDesc  'sR1=true
                                        End If
                                    Case 4
                                        If sBestRnd = sRnd Then 'highlight the best round
                                            sTmpRow.Append("<td>" & sEventClassIcon & " <b>" & sEventScoreDesc & "</b></td>")
                                        Else
                                            sTmpRow.Append("<td>" & sEventClassIcon & " " & sEventScoreDesc & "</td>")   'sRnd1Score = sEventScoreDesc  'sR1=true
                                        End If
                                    Case 5
                                        If sBestRnd = sRnd Then 'highlight the best round
                                            sTmpRow.Append("<td>" & sEventClassIcon & " <b>" & sEventScoreDesc & "</b></td>")
                                        Else
                                            sTmpRow.Append("<td>" & sEventClassIcon & " " & sEventScoreDesc & "</td>")   'sRnd1Score = sEventScoreDesc  'sR1=true
                                        End If
                                    Case 6
                                        If sBestRnd = sRnd Then 'highlight the best round
                                            sTmpRow.Append("<td>" & sEventClassIcon & " <b>" & sEventScoreDesc & "</b></td>")
                                        Else
                                            sTmpRow.Append("<td>" & sEventClassIcon & " " & sEventScoreDesc & "</td>")   'sRnd1Score = sEventScoreDesc  'sR1=true
                                        End If
                                    Case 25 ' Runoff Round
                                        sTmpRow.Append("<td>" & sEventClassIcon & " " & sEventScoreDesc & "</td>")
                                    Case 0  'error
                                        sTmpRow.Append("<td>No Score</td>")
                                End Select

                            Else 'only need score for selected round Expand format
                                'Header from calling function  <td>Rnd " & sSelRnd & "</td><td>Class</td><td>Ft/M or Points</td><td>NOPS</td>
                                sTmpRow.Append("<td><b>" & sEventClass & "</b></td><td><b>" & sEventScoreDesc & "</b></td><td><b>" & sNOPS & "</b></td></tr>")
                            End If

                            '                           sLine.Append(sTmpRow.ToString())
                        Loop
                        'ended loop.  Add extra td if needed and close out row
                        If i < sCols2Make Then
                            Do Until i = sCols2Make
                                sTmpRow.Append("<td></td>")
                                i += 1
                            Loop
                        End If
                        sTmpRow.Append("</tr>")

                    Else 'No data
                        sTmpRow.Append("<td colspan=""" & sCols2Make & """>  </td></tr>") 'Per Dave leave blan
                    End If
                End Using
            Catch ex As Exception
                sMsg = "<td colspan=""" & sCols2Make & """>Error at LBGetRndScores</td></tr>"
                sErrDetails = sMsg & " " & ex.Message & " " & ex.StackTrace
            End Try
        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
        Else
            Return sTmpRow.ToString()
        End If
    End Function
    Friend Function LoadDvList(ByVal sanctionID As String, ByVal EventCodePkd As String, ByVal DVPkd As String, ByVal RndPkd As String, ByRef DDL_Division As DropDownList, ByVal SRnds As String, ByVal TRnds As String, ByVal JRnds As String, ByRef DDL_PkRnd As DropDownList) As String
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sAgeGroup As String = ""
        Dim sSanctionID As String = sanctionID
        Dim sEventCode As String = EventCodePkd
        Dim sPREventCode As String = ""
        Dim sDVPkd As String = DVPkd
        Dim sRndPkd As String = RndPkd
        Dim sSB As New StringBuilder
        Dim sSQL As String = ""

        sSQL = "PrGetUsedAgeGroups"
        Select Case sEventCode
            Case "0"
                sMsg = "Please select an Event"
 '               sPREventCode = "ALL"   'Default to all so that DV and Rnd droplists are populated
            Case "A"
                '                sPREventCode = "ALL"
                sMsg = "Please select an Event"
            Case "S"
                sPREventCode = "Slalom"
            Case "T"
                sPREventCode = "Trick"
            Case "J"
                sPREventCode = "Jump"
            Case "O"
                sPREventCode = "Overall"
            Case Else  'If no event selected kick out
                sMsg = "Please select an Event"
                '               sPREventCode = "ALL"  'Default to all so that DV and Rnd droplists are populated
        End Select
        If Len(sMsg) > 2 Then
            DDL_Division.Items.Clear()
            DDL_PkRnd.Items.Clear()
            Return sMsg
            Exit Function
        End If
        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: LoadDVList could not get connection string."
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim cmdRead As New OleDb.OleDbCommand
        cmdRead.CommandType = CommandType.StoredProcedure
        cmdRead.CommandText = sSQL
        cmdRead.Parameters.Add("@InSanctionID", OleDb.OleDbType.VarChar)
        cmdRead.Parameters("@InSanctionID").Size = 6
        cmdRead.Parameters("@InSanctionID").Value = sSanctionID
        cmdRead.Parameters("@InSanctionID").Direction = ParameterDirection.Input

        cmdRead.Parameters.Add("@InEvCode", OleDb.OleDbType.VarChar)
        cmdRead.Parameters("@InEvCode").Size = 12
        cmdRead.Parameters("@InEvCode").Value = sPREventCode
        cmdRead.Parameters("@InEvCode").Direction = ParameterDirection.Input

        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                With DDL_Division
                    .Items.Clear()
                    .Items.Add(New ListItem("ALL DV", "ALL"))
                    Using cmdRead

                        cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                        cmdRead.Connection.Open()
                        MyDataReader = cmdRead.ExecuteReader
                        If MyDataReader.HasRows = True Then
                            Do While MyDataReader.Read()
                                sAgeGroup = CStr(MyDataReader.Item("AgeGroup"))
                                .Items.Add(New ListItem(sAgeGroup, sAgeGroup))
                            Loop
                        Else
                            sMsg = " No Entries Found for selected tournament. "
                            .Items.Clear()
                            .Items.Add(New ListItem("None Found", "0"))
                        End If 'end of has rows
                    End Using
                End With
            Catch ex As Exception
                sMsg += "Error: Can't retrieve Divisions Entered. "
                sErrDetails = " LoadDvList Caught: " & ex.Message & " " & ex.StackTrace & "<br>SQL= " & sSQL
                DDL_Division.Items.Clear()
            End Try
        End Using
        If sDVPkd <> "" Then
            DDL_Division.SelectedValue = sDVPkd
        End If
        'LIMIT ROUNDS BASED ON ROUNDS OFFERED IN SELECTED EVENT.  If All events is selected max rounds for event with most rounds is used.
        Dim i As Integer = 0
        Dim sSlalomRnds As String = SRnds 'should be 0 if not offered
        Dim sTrickRnds As String = TRnds
        Dim sJumpRnds As String = JRnds
        Dim sMaxRounds = sSlalomRnds
        If sTrickRnds > sMaxRounds Then sMaxRounds = sTrickRnds
        If sJumpRnds > sMaxRounds Then sMaxRounds = sJumpRnds
        Dim sMinRounds = sSlalomRnds
        If sTrickRnds > 0 And sTrickRnds < sMinRounds Then sMinRounds = sTrickRnds
        If sJumpRnds > 0 And sJumpRnds < sMinRounds Then sMinRounds = sJumpRnds

        With DDL_PkRnd
            .Items.Clear()
            .Items.Add(New ListItem("ALL Rnds", "0"))  'Defaults to all rounds if sEventCode is not in range or rounds not used (NCWSA)
            Select Case sEventCode
                Case "A"   'Include all rounds if overall is picked - or include overall and use minimum number of rounds offered in S, T, or J
                    For i = 1 To sMaxRounds
                        .Items.Add(New ListItem("Rnd " & i, i))
                    Next
                Case "S"
                    For i = 1 To sSlalomRnds
                        .Items.Add(New ListItem("Rnd " & i, i))
                    Next
                Case "T"
                    For i = 1 To sTrickRnds
                        .Items.Add(New ListItem("Rnd " & i, i))
                    Next
                Case "J"
                    For i = 1 To sJumpRnds
                        .Items.Add(New ListItem("Rnd " & i, i))
                    Next
                Case "O"
                    For i = 1 To sMinRounds
                        .Items.Add(New ListItem("Rnd " & i, i))
                    Next
            End Select
        End With
        If Len(sMsg) > 2 Then
            Return sMsg
        End If
        Return "Success"
    End Function

    Public Function GetTournamentList2(ByVal SkiYr As String, Optional ByVal region As String = "") As String
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSkiYr As String = Trim(SkiYr)
        Dim sHasVideo As String = ""
        Dim sVCount As Int32 = 0
        Dim curCalYr As String = Right(Year(Now()), 2)
        Dim lastYear As String = curCalYr - 2  'limit recordset to this calendar year and previous calendar year.  Consider using datediff back 3 months. instead of lastyear  
        Dim SQL As String = ""
        Dim sSB As New StringBuilder
        If sSkiYr = "0" Then
            '           SQL = "Select Top 20 SanctionID, Name, Class, Format(cast(EventDates as date), 'yyyyMMdd') AS FormattedDate, EventDates, EventLocation, Rules, SlalomRounds, TrickRounds, JumpRounds "
            '           SQL += " from LiveWebScoreboard.dbo.Tournament WHERE left(SanctionID,2) > " & lastYear & " and ISDATE(EventDates) = 1 "
            sSB.Append("  Select top 20 T.SanctionId, Name, Class, Format(cast(EventDates As Date), 'yyyyMMdd') AS FormattedDate, ")
            sSB.Append("  EventDates, EventLocation, Rules, SlalomRounds, TrickRounds, JumpRounds, COALESCE(VideoCount, 0) as VCount ")
            sSB.Append(" From Tournament T ")
            sSB.Append(" Left Outer Join ( Select TV.SanctionId, Count(Pass1VideoUrl) + Count(Pass1VideoUrl) as VideoCount From TrickVideo TV Group by SanctionId) as V ON V.SanctionId = T.SanctionId ")
            sSB.Append(" Where Left(T.SanctionId, 2) > " & lastYear & " and ISDATE(EventDates) = 1")
            sSB.Append("  Order by  FormattedDate desc ")

        Else
            '           SQL = "Select SanctionID, Name, Class, Format(cast(EventDates as date), 'yyyyMMdd') AS FormattedDate, EventDates, EventLocation, Rules, SlalomRounds, TrickRounds, JumpRounds from LiveWebScoreboard.dbo.Tournament "
            '           SQL += " WHERE left(SanctionID, 2) = '" & sSkiYr & "' AND ISDATE(EventDates) = 1 "
            sSB.Append("  Select T.SanctionId, Name, Class, Format(cast(EventDates As Date), 'yyyyMMdd') AS FormattedDate, ")
            sSB.Append("  EventDates, EventLocation, Rules, SlalomRounds, TrickRounds, JumpRounds, COALESCE(VideoCount, 0) as VCount ")
            sSB.Append(" From Tournament T ")
            sSB.Append(" Left Outer Join ( Select TV.SanctionId, Count(Pass1VideoUrl) + Count(Pass1VideoUrl) as VideoCount From TrickVideo TV Group by SanctionId) as V ON V.SanctionId = T.SanctionId ")
            sSB.Append(" Where Left(T.SanctionId, 2)  = '" & sSkiYr & "' AND ISDATE(T.EventDates) = 1 ")
            sSB.Append("  Order by FormattedDate desc ")

        End If
        SQL = sSB.ToString()

        Dim sqlTV As String = ""

        Dim sSanctionID As String = ""
        Dim sName As String = ""
        Dim sClass As String = ""
        Dim sEventDates As String = ""
        Dim sEventLocation As String = ""
        Dim sRules As String = ""
        Dim sLblText As String = ""
        Dim sBtnText As String = ""
        Dim sLine As String = ""
        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Can Not access data "
            sErrDetails = "<br />" & ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim Cnnt As New OleDb.OleDbConnection(sConn)

        Dim sHTML As New StringBuilder("")
        sHTML.Append("<table class=""table table-striped border-1"">")
        Dim cmdRead As New OleDb.OleDbCommand
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Using cmdRead
                Try
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.CommandText = SQL
                    cmdRead.Connection.Open()

                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()
                            sSanctionID = CStr(MyDataReader.Item("SanctionID"))
                            ' Region filter: region is the 3rd character of sanctionID
                            ' Always show collegiate tournaments (3rd character = 'U') regardless of region filter
                            If region <> "" Then
                                If sSanctionID.Length < 3 Then
                                    Continue Do
                                ElseIf UCase(Mid(sSanctionID, 3, 1)) = "U" Then
                                    ' Collegiate tournament - always show
                                ElseIf UCase(Mid(sSanctionID, 3, 1)) <> UCase(region) Then
                                    Continue Do
                                End If
                            End If
                            sName = CStr(MyDataReader.Item("Name"))
                            sClass = CStr(MyDataReader.Item("Class"))
                            sEventDates = Format(CDate(MyDataReader.Item("EventDates")), "MM/dd/yyyy")
                            sEventLocation = MyDataReader.Item("EventLocation")
                            sRules = MyDataReader.Item("Rules")
                            sVCount = MyDataReader.Item("VCount")
                            If sVCount > 0 Then
                                sHasVideo = "<img src=""Images/Flag-green16.png"" alt=""Trick Video Available"" title=""Trick Video Available, Select skier on Entry List"" />"
                            End If
                            sLblText = sSanctionID & "</b> " & sEventLocation
                            ' Output to console for backend test
                            Console.WriteLine($"[REGION TEST] {sSanctionID} - {sName} - Region: {Mid(sSanctionID, 3, 1)}")
                            sHTML.Append("<tr><td>" & sHasVideo & "</td><td><a runat=""server"" href=""Tournament.aspx?SN=" & sSanctionID & "&FM=1&SY=" & sSkiYr & """><b>" & sName & "</b></a><b> " & sEventDates & " " & sLblText & "</td></tr>")
                            '
                            sHasVideo = ""
                        Loop
                    Else
                        sHTML.Append("<tr><td>No Tournaments Results on file in " & curCalYr & "</td></tr>")
                    End If 'end of has rows

                Catch ex As Exception
                    sMsg += "Error: getting tournament list  "
                    sErrDetails = ex.Message & " " & ex.StackTrace & "<br>SQL= " & SQL
                    sMsg += sErrDetails
                Finally

                End Try
            End Using
        End Using
        sHTML.Append("</table>")

        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        Return sHTML.ToString
    End Function
    Public Function GetCurrentEvent(ByVal SanctionID As String, ByVal minutes As Int16) As String
        'Use PRGetMostRecentScores with minutes set to - (negative) number of minutes since performance.  
        'For Tournament.aspx want distinct event in last 30 minutes. Display Event, Div, Round of first record.
        '   if record 2 is different event and within 5 minutes of record 1, display both.  continue until all 3 events or more than 5 minutes
        'For recent scores use -30 as switch to show hide droplist option for Most Recent page.  If no records hide the option.
        '
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sReturnArray(0 To 3)
        Dim sSanctionID As String = SanctionID
        Dim sMinutes As Int16 = minutes
        Dim sConn As String = ""
        Dim sSQL As String = "PRGetMostRecentScores"
        Dim sEvent As String = ""
        Dim sTmpEvent As String = ""
        Dim sDV As String = ""
        Dim sTmpDv As String = ""
        Dim sRnd As String = ""
        Dim sReturnString1 = ""
        'NEED sTmpTime and sTime (as datetime?)
        Dim sCurEvent As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: LoadDVList could not get connection string."
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim cmdRead As New OleDb.OleDbCommand
        cmdRead.CommandType = CommandType.StoredProcedure
        cmdRead.CommandText = sSQL
        cmdRead.Parameters.Add("@InSanctionID", OleDb.OleDbType.VarChar)
        cmdRead.Parameters("@InSanctionID").Size = 6
        cmdRead.Parameters("@InSanctionID").Value = sSanctionID
        cmdRead.Parameters("@InSanctionID").Direction = ParameterDirection.Input

        cmdRead.Parameters.Add("@InLastMinuteCheck", OleDb.OleDbType.Integer)
        cmdRead.Parameters("@InLastMinuteCheck").Value = sMinutes
        cmdRead.Parameters("@InLastMinuteCheck").Direction = ParameterDirection.Input

        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try

                Using cmdRead

                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()

                            'If this is first time
                            '   add event, division, round to string
                            '   stmpTime = sTime
                            '   sTmpEvent = sEvent
                            'if another time exists and sTmpEvent <> sEvent and tmpTime within 5 minutes of sTime then
                            '   Add Event, Div, Rnd

                            sEvent = CStr(MyDataReader.Item("Event"))
                            sRnd = CStr(MyDataReader.Item("Round"))
                            sDV = CStr(MyDataReader.Item("Div"))

                            If sTmpEvent = "" Then
                                sTmpEvent = sEvent
                                sTmpDv = sDV
                                sReturnString1 = "Active Event(s)  "
                                sReturnString1 += sDV & " " & sEvent & " Round " & sRnd
                            Else

                                If sEvent <> sTmpEvent Or sDV <> sTmpDv Then
                                    sReturnString1 += "<br>" & sDV & " " & sEvent & " Round " & sRnd
                                End If
                            End If
                        Loop
                    Else
                        sReturnString1 = ""
                    End If 'end of has rows
                End Using

            Catch ex As Exception
                sMsg += "Error: Can't retrieve Current Event. "
                sErrDetails = " GetCurrentEvent Caught: " & ex.Message & " " & ex.StackTrace & "<br>SQL= " & sSQL

            End Try
        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        Return sReturnString1
    End Function
    Friend Function GetTournamentSpecs(ByVal SanctionID As String) As Array
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim SQL As String = ""
        Dim sSanctionID As String = Trim(SanctionID)
        SQL = "Select SanctionID, Name, Class, EventDates, EventLocation, Rules, SlalomRounds, TrickRounds, JumpRounds from Tournament WHERE SanctionID = '" & sSanctionID & "'"
        Dim sName As String = ""
        Dim sClass As String = ""
        Dim sEventDates As String = ""
        Dim sEventLocation As String = ""
        Dim sRules As String = ""
        Dim sSlalomRounds As Int16 = 0
        Dim sTrickRounds As Int16 = 0
        Dim sJumpRounds As Int16 = 0
        Dim arrSpecs(0 To 9, 0 To 2)
        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If

        Catch ex As Exception
            sMsg = "Error: Can not access data"
            sErrDetails = "Error: GetTournamentSpecs could not retrieve connection string. " & ex.Message & "  " & ex.StackTrace
            arrSpecs(0, 0) = sMsg
            Return arrSpecs
            Exit Function
        End Try
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        '        Dim sTableWidth As String = "100%"
        '        Dim sText As String = "<table width=""" & sTableWidth & """>"
        Dim cmdRead As New OleDb.OleDbCommand
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.CommandText = SQL
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()

                            sSanctionID = CStr(MyDataReader.Item("SanctionID"))
                            sName = CStr(MyDataReader.Item("Name"))
                            sClass = CStr(MyDataReader.Item("Class"))
                            sEventDates = MyDataReader.Item("EventDates")
                            sEventLocation = MyDataReader.Item("EventLocation")
                            sRules = MyDataReader.Item("Rules")
                            sSlalomRounds = MyDataReader.Item("SlalomRounds")
                            sTrickRounds = MyDataReader.Item("TrickRounds")
                            sJumpRounds = MyDataReader.Item("JumpRounds")

                            arrSpecs(1, 1) = "SanctionID:"
                            arrSpecs(1, 2) = sSanctionID.ToString
                            arrSpecs(2, 1) = "Name:"
                            arrSpecs(2, 2) = sName.ToString
                            arrSpecs(3, 1) = "Start Date:"
                            arrSpecs(3, 2) = sEventDates
                            arrSpecs(4, 1) = "Location:"
                            arrSpecs(4, 2) = sEventLocation
                            arrSpecs(5, 1) = "Rules:"
                            arrSpecs(5, 2) = sRules
                            arrSpecs(6, 1) = "Slalom Rounds"
                            arrSpecs(6, 2) = sSlalomRounds
                            arrSpecs(7, 1) = "Trick Rounds"
                            arrSpecs(7, 2) = sTrickRounds
                            arrSpecs(8, 1) = "Jump Rounds"
                            arrSpecs(8, 2) = sJumpRounds

                        Loop
                    Else
                        arrSpecs(0, 0) = "Data for " & sSanctionID & " is not available"
                    End If 'end of has rows
                End Using
            Catch ex As Exception
                sErrDetails += "Error: GetTournamentSpecs Caught: <br />" & ex.Message & " " & ex.StackTrace & "<br> SQL= " & SQL
                arrSpecs(0, 0) = "Error retrieving tournament information."
            End Try
        End Using
        Return arrSpecs
    End Function

    Friend Function GetOfficials(ByVal SanctionID As String) As Array
        Dim sSanctionID As String = SanctionID
        Dim arrOfficials(0 To 20, 0 To 2)
        Dim i As Integer = 1
        Dim sJudgeChief As String = ""
        Dim sDriverChief As String = ""
        Dim sScoreChief As String = ""
        Dim sSafetyChief As String = ""
        Dim sJudgeAppointed As String = ""
        Dim sTechChief As String = ""
        Dim sSQL As String = ""

        Dim sAssignment As String = ""

        sSQL = "PrGetOfficialsPanel"   '24E017, 24U269, 23E998, 23S999
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSkierName As String = ""
        Dim sPosition As String = ""

        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: GetTournamentSpecs could not retrieve connection string. "
            sErrDetails = "At GetOfficials Conn" & ex.Message & "  " & ex.StackTrace
            arrOfficials(0, 0) = sMsg
            Return arrOfficials
            Exit Function
        End Try
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim cmdRead As New OleDb.OleDbCommand
        'sUsePR = true
        cmdRead.CommandType = CommandType.StoredProcedure
        cmdRead.CommandText = sSQL
        cmdRead.Parameters.Add("@InSanctionID", OleDb.OleDbType.VarChar)
        cmdRead.Parameters("@InSanctionID").Size = 6
        cmdRead.Parameters("@InSanctionID").Value = sSanctionID
        cmdRead.Parameters("@InSanctionID").Direction = ParameterDirection.Input

        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()
                            sSkierName = MyDataReader.Item("SkierName") 'this field is in both queries
                            sAssignment = MyDataReader.Item("Assignment")
                            arrOfficials(i, 1) = sAssignment
                            arrOfficials(i, 2) = sSkierName
                            ' IF using officials ratings need to test for null unless driver and scorer ratings are included.
                            'JudgeSlalomRating
                            'JudgeTrickRating
                            'JudgeJumpRating
                            i += 1
                        Loop
                    Else
                        arrOfficials(0, 0) = "No Officials Data is Available."
                    End If 'end of has rows
                End Using
            Catch ex As Exception
                sMsg += "Error: at GetOfficials"
                sErrDetails = ex.Message & " " & ex.StackTrace
                arrOfficials(0, 0) = sMsg
            End Try
        End Using
        Return arrOfficials
    End Function
    Friend Function GetTeams(ByVal SanctionID As String) As String
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sSQL As String = "select distinct TeamCode from EventReg where sanctionID = '" & sSanctionID & "'"
        Dim sTeamCode As String = ""
        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: LoadDVList could not get connection string. "
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim cmdRead As New OleDb.OleDbCommand
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Dim i As Integer = 0
        Dim sTeamList As String = ""
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.CommandText = sSQL
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()
                            If IsDBNull(MyDataReader.Item("TeamCode")) Then
                                sTeamCode = "N/A"
                            Else
                                i += 1
                                sTeamCode = CStr(MyDataReader.Item("TeamCode"))
                                If i = 1 Then
                                    sTeamList += sTeamCode
                                Else
                                    sTeamList += ", " & sTeamCode
                                End If
                            End If
                        Loop
                    Else
                        sTeamList = "Error: No Teams Found for selected tournament. " 'prefix error prevents display of Panel_Teams
                    End If 'end of has rows
                End Using
            Catch ex As Exception
                sMsg += "Error: Can't retrieve Teams. "
                sErrDetails = " At Populate Teams " & ex.Message & " " & ex.StackTrace & " <br />SQL= " & sSQL
            End Try
        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
        Else
            Return sTeamList
        End If
    End Function

    ' Helper method to generate skier row HTML for BestRndLeftSP
    Private Sub AddSkierRowToSection(ByRef sDVScoresSection As StringBuilder, MyDataReader As OleDb.OleDbDataReader,
                                   selEvent As String, sEventPkd As String, sSanctionID As String, sYrPkd As String,
                                   sMemberID As String, sTmpDv As String, sTName As String, sSelRnd As String,
                                   sSkierName As String, sShowBuoys As String, sHasVideo As String, sReadyForPlcmt As String,
                                   sRound As String, sScoreBest As String, sSelEvent As String, sDv As String,
                                   sRndsSlalomOffered As String, sRndsTrickOffered As String, sRndsJumpOffered As String,
                                   sNopsScore As String, sRndCols As String)

        ' Create skier name link
        Dim linkEventCode As String = If(selEvent = "O", "S", sEventPkd)
        sDVScoresSection.Append("<tr><td><a runat=""server""  href=""Trecap?SID=" & sSanctionID & "&SY=" & sYrPkd & "&MID=" & sMemberID & "&DV=" & sTmpDv & "&EV=" & linkEventCode & "&TN=" & sTName & "")

        If sSelRnd = "0" Then
            sDVScoresSection.Append("&FC=LBSP&FT=0&RP=1&UN=0&UT=0&SN=" & sSkierName & """ ><b>" & sSkierName & "</b></a><b> " & sShowBuoys & "</b>" & sHasVideo & sReadyForPlcmt & "</td>")
        Else
            sDVScoresSection.Append("&FC=LBSP&FT=0&RP=1&UN=0&UT=0&SN=" & sSkierName & """ ><b>" & sSkierName & "</b></a>" & sHasVideo & sReadyForPlcmt & "</td>")
        End If

        ' Handle Overall vs Regular events
        If selEvent = "O" Then
            Try
                sDVScoresSection.Append("<td>" & sRound & "</td>")
                sDVScoresSection.Append("<td><b>" & sScoreBest & "</b></td>") 'Overall score

                'Get individual event NOPS scores
                Dim sSlalomNops As String = "--"
                Dim sTrickNops As String = "--"
                Dim sJumpNops As String = "--"

                Try
                    If Not IsDBNull(MyDataReader.Item("NopsScoreSlalom")) Then
                        sSlalomNops = Format(MyDataReader.Item("NopsScoreSlalom"), "0.00")
                    End If
                Catch ex As Exception
                    sSlalomNops = "--"
                End Try

                Try
                    If Not IsDBNull(MyDataReader.Item("NopsScoreTrick")) Then
                        sTrickNops = Format(MyDataReader.Item("NopsScoreTrick"), "0.00")
                    End If
                Catch ex As Exception
                    sTrickNops = "--"
                End Try

                Try
                    If Not IsDBNull(MyDataReader.Item("NopsScoreJump")) Then
                        sJumpNops = Format(MyDataReader.Item("NopsScoreJump"), "0.00")
                    End If
                Catch ex As Exception
                    sJumpNops = "--"
                End Try

                sDVScoresSection.Append("<td>" & sSlalomNops & "</td>")
                sDVScoresSection.Append("<td>" & sTrickNops & "</td>")
                sDVScoresSection.Append("<td>" & sJumpNops & "</td></tr>")

            Catch ex As Exception
                ' Fallback: just display overall score with skier name link
                sDVScoresSection.Append("<td><a runat=""server"" href=""Trecap?SID=" & sSanctionID & "&SY=" & sYrPkd & "&MID=" & sMemberID & "&DV=" & sTmpDv & "&EV=S&TN=" & sTName & "&FC=LBSP&FT=0&RP=1&UN=0&UT=0&SN=" & sSkierName & """><b>" & sSkierName & "</b></a></td>")
                sDVScoresSection.Append("<td>" & sRound & "</td>")
                sDVScoresSection.Append("<td><b>" & sScoreBest & "</b></td>")
                sDVScoresSection.Append("<td>--</td><td>--</td><td>--</td></tr>")
            End Try
        Else
            'Regular events use LBGetRndScores
            Dim sMultiRndScores As String = ModDataAccess3.LBGetRndScores(sSanctionID, sMemberID, sSelEvent, sDv, sSelRnd, sRound, sRndsSlalomOffered, sRndsTrickOffered, sRndsJumpOffered, sNopsScore)
            If sMultiRndScores <> "Error" Then
                sDVScoresSection.Append(sMultiRndScores)
            Else
                sDVScoresSection.Append("<tr><td colspan=""" & sRndCols & """</td> No scores found. </tr>")
            End If
        End If
    End Sub

    Public Function LeaderBoardBestRndLeftSP(ByVal SanctionID As String, ByVal SkiYr As String, ByVal TName As String, ByVal selEvent As String, ByVal selDv As String, ByVal selRnd As String, ByVal RndsSlalomOffered As String, ByVal RndsTrickOffered As String, ByVal RndsJumpOffered As String, ByVal UseNOPS As Int16, ByVal UseTeams As Int16, ByVal selFormat As String, ByVal DisplayMetric As Int16) As String
        'This function is run for each event selected based on code in TLeaderBoard_Load and Btn_Update
        Dim sReturn As String = ""
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sStopHere As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sYrPkd As String = SkiYr
        Dim sTName As String = TName
        Dim sSelEvent As String = ""  'Event Selected as Slalom Trick, Jump
        Dim sEventPkd As String = selEvent 'Event as S, T, or J
        Dim sSelRnd As String = selRnd   'Round selected as a filter
        Dim sSelDV As String = selDv    'Div selected as a filter
        Dim sRndsSlalomOffered = RndsSlalomOffered
        Dim sRndsTrickOffered = RndsTrickOffered
        Dim sRndsJumpOffered = RndsJumpOffered
        Dim sRndsThisEvent As String = ""  'generic form of RndsSSlalomOffered, etc.
        Dim sRoundsHTML As String = ""  'string of <td>Rnd " & i & "</td> one for each round in an event
        Dim sRndCols As Int16 = 0  'Number of <td></td> sections in the table based on rounds offered + one column for Name and best score
        Dim sRound As String = ""  'Round in which best score was achieved
        Dim sSkierName As String = ""
        Dim sMemberID As String = ""
        Dim sEventScoreDesc As String = ""
        Dim sScoreBest As String = ""
        Dim sEventScore As String = ""
        Dim stmpMemberID As String = ""
        Dim i As Integer = 0
        Dim j As Integer = 0
        Dim sDv As String = ""
        Dim sTmpDv As String = ""
        Dim sRunOffDv As String = ""
        Dim sEventClass As String = ""
        Dim sEventGroup As String = ""
        Dim sCity As String = ""
        Dim sState As String = ""
        Dim sFederation As String = ""
        Dim sRankingScore As String = ""
        Dim sNopsScore As String = ""
        Dim sUseNOPS As Int16 = UseNOPS
        Dim suUseTeams As Int16 = UseTeams
        Dim sSlalomHeader As String = ""
        Dim sTrickHeader As String = ""
        Dim sUnit As String = ""
        Dim sJumpHeader As String = ""
        Dim sLine As New StringBuilder
        Dim sDVScoresSection As New StringBuilder
        Dim sDVHeader As String = ""
        Dim sMultiRndScores As String = ""
        Dim sSql As String = ""
        Dim sShowBuoys As String = ""
        Dim sTVidAvail As String = ""
        Dim sHasVideo As String = ""
        Dim sHasRunoff As Boolean = False
        Dim sRunoffSection As String = ""
        Dim sScoreRunoff As String = ""
        Dim sSlalomNops As String = ""
        Dim sTrickNops As String = ""
        Dim sJumpNops As String = ""
        Dim sPlcmtFormat As String = ""
        Dim sReadyForPlcmt As String = ""

        Select Case selEvent
            Case "S"
                sSelEvent = "Slalom"
                sSql = " PrLeaderBoard"
                sRndsThisEvent = sRndsSlalomOffered
                sUnit = " Buoys"
                If sSelRnd = "0" Then
                    sRndCols = CStr(CInt(sRndsSlalomOffered) + 1)
                    For j = 1 To RndsSlalomOffered
                        sRoundsHTML += "<td><b>Rnd&nbsp;" & j & "</b></td>"
                    Next
                    sRoundsHTML += "</tr>"
                Else
                    sRoundsHTML += "<td>Class</td><td>Score</td><td>NOPS</td>"
                    sRndCols = "6"
                End If


            Case "T"
                sSelEvent = "Trick"
                sSql = "PrLeaderBoard"
                sRndsThisEvent = sRndsTrickOffered
                sUnit = " Points"
                If sSelRnd = "0" Then
                    sRndCols = CStr(CInt(sRndsTrickOffered) + 1)  'Rnds + name + 2 for BestRnd
                    For j = 1 To RndsTrickOffered
                        sRoundsHTML += "<td><b>Rnd&nbsp;" & j & "</b></td>"
                    Next
                    sRoundsHTML += "</tr>"
                Else
                    sRoundsHTML += "<td>Class</td><td> Points </td><td>NOPS</td>"
                    sRndCols = "4"
                End If

            Case "J"
                sSelEvent = "Jump"
                sSql = "PrLeaderBoard"
                sRndsThisEvent = sRndsJumpOffered
                sUnit = " Feet"
                If sSelRnd = "0" Then
                    sRndCols = CStr(CInt(sRndsJumpOffered) + 1)  'Rnds + name + 2 for BestRnd
                    For j = 1 To RndsJumpOffered
                        sRoundsHTML += "<td><b>Rnd&nbsp;" & j & "</b></td>"
                    Next
                    sRoundsHTML += "</tr>"
                Else
                    sRoundsHTML += "<td>Class</td><td> Ft/M </td><td>NOPS</td></tr>"
                    sRndCols = "4"
                End If
            Case "O"
                sSelEvent = "Overall"
                sSql = "PrGetScoresOverall"
                sUnit = " Points"
                sRoundsHTML += "<td>Round</td><td>Overall Score</td><td>Slalom NOPS</td><td>Trick NOPS</td><td>Jump NOPS</td></tr>"
                sRndCols = "6"
            Case Else
                sMsg = "<td>Event code out of range</td></tr>"
                Return sMsg
                Exit Function
        End Select

        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: GetRunOrder could not get connection string."
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim cmdRead As New OleDb.OleDbCommand
        cmdRead.CommandType = CommandType.StoredProcedure
        cmdRead.CommandText = sSql

        If selEvent = "O" Then
            cmdRead = GetOverallScoresData(sSanctionID, sSelDV)
        Else
            'Regular event stored procedures (PrLeaderBoard)
            cmdRead.Parameters.Add("@InSanctionID", OleDb.OleDbType.VarChar)
            cmdRead.Parameters("@InSanctionID").Size = 6
            cmdRead.Parameters("@InSanctionID").Value = sSanctionID
            cmdRead.Parameters("@InSanctionID").Direction = ParameterDirection.Input

            cmdRead.Parameters.Add("@InEvCode", OleDb.OleDbType.VarChar)
            cmdRead.Parameters("@InEvCode").Size = 12
            cmdRead.Parameters("@InEvCode").Value = sSelEvent
            cmdRead.Parameters("@InEvCode").Direction = ParameterDirection.Input

            cmdRead.Parameters.Add("@InFormat", OleDb.OleDbType.VarChar)
            cmdRead.Parameters("@InFormat").Size = 12
            cmdRead.Parameters("@InFormat").Value = "Best"    '0 = All Rounds    sSelRnd
            cmdRead.Parameters("@InFormat").Direction = ParameterDirection.Input

            cmdRead.Parameters.Add("@InDV", OleDb.OleDbType.VarChar)
            cmdRead.Parameters("@InDV").Size = 3
            cmdRead.Parameters("@InDV").Value = sSelDV   'This is the division selected for display.  sDv is the division in which the skier is performing.
            cmdRead.Parameters("@InDV").Direction = ParameterDirection.Input
        End If

        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Dim rowCount As Integer = 0
                        Do While MyDataReader.Read()
                            rowCount += 1
                            If selEvent = "O" Then
                                sSanctionID = CStr(MyDataReader.Item("SanctionId"))   ' Note: SanctionId from stored procedure
                                sSkierName = CStr(MyDataReader.Item("SkierName"))

                                If Not IsDBNull(MyDataReader.Item("AgeGroup")) Then
                                    sDv = CStr(MyDataReader.Item("AgeGroup"))
                                Else
                                    sDv = ""
                                End If

                                If Not IsDBNull(MyDataReader.Item("Round")) Then
                                    sRound = CStr(MyDataReader.Item("Round"))
                                Else
                                    sRound = "1"
                                End If

                                If Not IsDBNull(MyDataReader.Item("MemberId")) Then  ' Note: MemberId from stored procedure
                                    sMemberID = MyDataReader.Item("MemberId")
                                Else
                                    sMemberID = ""
                                End If

                                If Not IsDBNull(MyDataReader.Item("NopsScoreOverall")) Then
                                    sScoreBest = Format(MyDataReader.Item("NopsScoreOverall"), "0.00")
                                Else
                                    sScoreBest = "0.00"
                                End If
                            Else

                                sSanctionID = CStr(MyDataReader.Item("SanctionID"))
                                sSkierName = CStr(MyDataReader.Item("SkierName"))

                                If Not IsDBNull(MyDataReader.Item("DiV")) Then
                                    sDv = CStr(MyDataReader.Item("DiV"))
                                Else
                                    sDv = ""
                                End If

                                If Not IsDBNull(MyDataReader.Item("Round")) Then
                                    sRound = CStr(MyDataReader.Item("Round"))
                                Else
                                    sRound = ""
                                End If
                                If Not IsDBNull(MyDataReader.Item("MemberID")) Then
                                    sMemberID = MyDataReader.Item("MemberID")
                                Else
                                    sMemberID = ""
                                End If
                                If Not IsDBNull(MyDataReader.Item("EventScore")) Then
                                    sScoreBest = MyDataReader.Item("EventScore")
                                Else
                                    sScoreBest = ""
                                End If
                            End If

                            If (sDv <> "OM" And sDv <> "OW") And selEvent = "S" Then
                                sShowBuoys = sScoreBest & " Buoys"
                            Else
                                sShowBuoys = ""
                            End If

                            If selEvent = "O" Then

                                If Not IsDBNull(MyDataReader.Item("NopsScoreOverall")) Then
                                    sNopsScore = Format(MyDataReader.Item("NopsScoreOverall"), "0.00")
                                Else
                                    sNopsScore = "0.00"
                                End If
                            Else
                                'Regular events have these fields
                                If Not IsDBNull(MyDataReader.Item("ScoreRunoff")) Then
                                    sScoreRunoff = MyDataReader.Item("ScoreRunoff")
                                Else
                                    sScoreRunoff = ""
                                End If

                                If Not IsDBNull(MyDataReader.Item("EventClass")) Then
                                    sEventClass = MyDataReader.Item("EventClass")
                                Else
                                    sEventClass = ""
                                End If
                                If Not IsDBNull(MyDataReader.Item("City")) Then
                                    sCity = MyDataReader.Item("City")
                                Else
                                    sCity = ""
                                End If
                                If Not IsDBNull(MyDataReader.Item("State")) Then
                                    sState = MyDataReader.Item("State")
                                Else
                                    sState = ""
                                End If
                                If Not IsDBNull(MyDataReader.Item("Federation")) Then
                                    sFederation = MyDataReader.Item("Federation")
                                Else
                                    sFederation = ""
                                End If
                                If Not IsDBNull(MyDataReader.Item("RankingScore")) Then
                                    sRankingScore = MyDataReader.Item("RankingScore")
                                Else
                                    sRankingScore = ""
                                End If
                                If Not IsDBNull(MyDataReader.Item("NOPSScore")) Then
                                    sNopsScore = MyDataReader.Item("NOPSScore")
                                Else
                                    sNopsScore = ""
                                End If
                            End If
                            sReadyForPlcmt = ""
                            If Not IsDBNull(MyDataReader.Item("ReadyForPlcmt")) Then
                                If MyDataReader.Item("ReadyForPlcmt") <> "Y" Then
                                    sReadyForPlcmt = "&nbsp;<span class=""class-logo class-x"" title=""NOT for placement"">X</span>"
                                End If
                            End If

                            sHasVideo = ""
                            'ONLY for Trick - Show trick video flag if available- 
                            If selEvent = "T" Then
                                If Not IsDBNull(MyDataReader.Item("Pass1VideoURL")) Then
                                    sTVidAvail = "Y"
                                End If

                                If Not IsDBNull(MyDataReader.Item("Pass2VideoURL")) Then
                                    sTVidAvail = "Y"
                                End If
                                If sTVidAvail = "Y" Then
                                    sHasVideo = "<img src=""Images/Flag-green16.png"" alt=""Trick Video Available"" title=""Trick Video Available, Select skier on Entry List"" />"
                                End If
                            End If
                            sPlcmtFormat = UCase(MyDataReader.Item("plcmtformat"))

                            If sTmpDv = "" Then
                                'Get the division header for first division
                                sDVHeader = "<table class=""table table-striped division-section"" style=""margin-bottom: 1rem;"">"
                                'Start the first Dataline
                                ' Add round info if specific round is selected
                                Dim sRoundInfo As String = ""
                                If sSelRnd <> "0" And sSelRnd <> "" Then
                                    sRoundInfo = "Round " & sSelRnd & " -"
                                End If
                                sDVScoresSection.Append("<tr class=""table-header-row""><td width=""35%""><b>" & sSelEvent & " " & sDv & " - " & sRoundInfo & " Sort by: " & sPlcmtFormat & "</b></td>" & sRoundsHTML)
                                ' Add runoff row if runoffs exist for this division (but not for Overall)
                                If selEvent <> "O" Then
                                    Dim sRunoffSectionContent As String = ModDataAccessPro.GetRunoffSection(sSanctionID, sSelEvent, sDv)
                                    If sRunoffSectionContent <> "" And Not sRunoffSectionContent.Contains("No RunOffs Found") And Not sRunoffSectionContent.Contains("Error") Then
                                        sDVScoresSection.Append("<tr><td colspan=""" & sRndCols & """ style=""background-color: #ffebee; padding: 8px; font-style: italic;"">" & sRunoffSectionContent & "</td></tr>")
                                    End If
                                End If
                                sTmpDv = sDv
                            End If
                            'Get the first MemberID' first record in first pass through data
                            If stmpMemberID = "" Then stmpMemberID = sMemberID

                            If sTmpDv = sDv Then 'Continue in same Division
                                'call helper method
                                AddSkierRowToSection(sDVScoresSection, MyDataReader, selEvent, sEventPkd, sSanctionID, sYrPkd,
                                                   sMemberID, sTmpDv, sTName, sSelRnd, sSkierName, sShowBuoys, sHasVideo, sReadyForPlcmt,
                                                   sRound, sScoreBest, sSelEvent, sDv, sRndsSlalomOffered, sRndsTrickOffered, sRndsJumpOffered,
                                                   sNopsScore, sRndCols)
                                If sScoreRunoff <> "" Then
                                    sHasRunoff = True
                                    sRunOffDv = sDv
                                End If
                            Else 'Division changed.
                                sLine.Append(sDVHeader)
                                sDVScoresSection.Append("</table>")
                                sLine.Append(sDVScoresSection.ToString())
                                'reset the division variables
                                sDVScoresSection.Clear()
                                sRunoffSection = ""
                                sDVHeader = ""
                                sHasRunoff = False
                                ' Start new Division
                                stmpMemberID = sMemberID
                                sTmpDv = sDv
                                sDVHeader = "<table class=""table table-striped division-section"" style=""margin-bottom: 1rem;"">"
                                Dim sRoundInfo As String = ""
                                If sSelRnd <> "0" And sSelRnd <> "" Then
                                    sRoundInfo = "Round " & sSelRnd & " -"
                                End If
                                sDVScoresSection.Append("<tr class=""table-header-row""><td width=""35%""><b>" & sSelEvent & " " & sDv & " - " & sRoundInfo & " Sort by: " & sPlcmtFormat & "</b></td>" & sRoundsHTML)
                                ' Add runoff row if runoffs exist for this division (but not for Overall)
                                If selEvent <> "O" Then
                                    Dim sRunoffSectionContent As String = ModDataAccessPro.GetRunoffSection(sSanctionID, sSelEvent, sDv)
                                    If sRunoffSectionContent <> "" And Not sRunoffSectionContent.Contains("No RunOffs Found") And Not sRunoffSectionContent.Contains("Error") Then
                                        sDVScoresSection.Append("<tr><td colspan=""" & sRndCols & """ style=""background-color: #ffebee; padding: 8px; font-style: italic;"">" & sRunoffSectionContent & "</td></tr>")
                                    End If
                                End If
                                'call helper method
                                AddSkierRowToSection(sDVScoresSection, MyDataReader, selEvent, sEventPkd, sSanctionID, sYrPkd,
                                                   stmpMemberID, sTmpDv, sTName, sSelRnd, sSkierName, sShowBuoys, sHasVideo, sReadyForPlcmt,
                                                   sRound, sScoreBest, sSelEvent, sDv, sRndsSlalomOffered, sRndsTrickOffered, sRndsJumpOffered,
                                                   sNopsScore, sRndCols)
                            End If

                        Loop
                        sLine.Append(sDVHeader)
                        sDVScoresSection.Append("</table>")
                        sLine.Append(sDVScoresSection.ToString())
                    Else
                        ' Skip this division
                    End If

                End Using
            Catch ex As Exception
                sMsg = "Error at LeaderBoardBestRndLeftSP"
                sErrDetails = sMsg & " " & ex.Message & " " & ex.StackTrace
            End Try

        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
        Else
            Dim result = sLine.ToString()
            Return result
        End If
    End Function

    Public Function GetOverallScoresData(ByVal sanctionId As String, ByVal selectedDivision As String) As OleDb.OleDbCommand
        'Extracted overall score calculation SQL for better maintainability
        'Returns configured command ready for execution
        Dim cmdRead As New OleDb.OleDbCommand
        cmdRead.CommandType = CommandType.Text

        cmdRead.CommandText = "
            SELECT R.SanctionId, R.MemberId, R.SkierName, R.AgeGroup, AllRounds.Round as [Round],
                   '' as TourClass, 'Y' as ReadyForPlcmt,
                   COALESCE(S.NopsScore, 0) as NopsScoreSlalom,
                   COALESCE(T.NopsScore, 0) as NopsScoreTrick, 
                   COALESCE(J.NopsScore, 0) as NopsScoreJump,
                   (COALESCE(S.NopsScore, 0) + COALESCE(T.NopsScore, 0) + COALESCE(J.NopsScore, 0)) as NopsScoreOverall,
                   3 as EventsReqd, 1 as OverallQualified,
                   'BEST' as PlcmtFormat, 'TBD' as Status, 0 as NopsScore,
                   R.SkiYearAge, R.AgeGroup as Div, R.Gender, R.City, R.State, R.Federation
            FROM TourReg R
            INNER JOIN (
                SELECT DISTINCT SanctionId, MemberId, AgeGroup, Round 
                FROM (
                    SELECT SanctionId, MemberId, AgeGroup, Round FROM SlalomScore WHERE Round < 25 AND NopsScore IS NOT NULL
                    UNION
                    SELECT SanctionId, MemberId, AgeGroup, Round FROM TrickScore WHERE Round < 25 AND NopsScore IS NOT NULL  
                    UNION
                    SELECT SanctionId, MemberId, AgeGroup, Round FROM JumpScore WHERE Round < 25 AND NopsScore IS NOT NULL
                ) AS AllEventRounds
            ) AllRounds ON R.SanctionId = AllRounds.SanctionId AND R.MemberId = AllRounds.MemberId AND R.AgeGroup = AllRounds.AgeGroup
            LEFT JOIN SlalomScore S ON R.SanctionId = S.SanctionId AND R.MemberId = S.MemberId AND R.AgeGroup = S.AgeGroup AND S.Round = AllRounds.Round
            LEFT JOIN TrickScore T ON R.SanctionId = T.SanctionId AND R.MemberId = T.MemberId AND R.AgeGroup = T.AgeGroup AND T.Round = AllRounds.Round
            LEFT JOIN JumpScore J ON R.SanctionId = J.SanctionId AND R.MemberId = J.MemberId AND R.AgeGroup = J.AgeGroup AND J.Round = AllRounds.Round
            WHERE R.SanctionId = ?" & If(selectedDivision = "" Or selectedDivision = "All", "", " AND R.AgeGroup = ?") & "
            ORDER BY " & If(selectedDivision = "" Or selectedDivision = "All", "R.AgeGroup, NopsScoreOverall DESC, R.MemberId, AllRounds.Round", "NopsScoreOverall DESC, R.MemberId, AllRounds.Round")

        ' Add parameters based on division filter
        cmdRead.Parameters.Add("@SanctionId", OleDb.OleDbType.VarChar, 6).Value = sanctionId
        If selectedDivision <> "" And selectedDivision <> "All" Then
            cmdRead.Parameters.Add("@AgeGroup", OleDb.OleDbType.VarChar, 3).Value = selectedDivision
        End If

        Return cmdRead
    End Function

    Public Function LeaderBoardROUND(ByVal SanctionID As String, ByVal SkiYr As String, ByVal TName As String, ByVal selEvent As String, ByVal selDv As String, ByVal selRnd As String, ByVal RndsSlalomOffered As String, ByVal RndsTrickOffered As String, ByVal RndsJumpOffered As String, ByVal UseNOPS As Int16, ByVal UseTeams As Int16, ByVal selFormat As String, ByVal DisplayMetric As Int16) As String
        'Called from LeaderBoardSP when plcmntFormat = ROUND
        Dim sReturn As String = ""
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sStopHere As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sYrPkd As String = SkiYr
        Dim sTName As String = TName
        Dim sSelEvent As String = ""  'Event Selected as Slalom Trick, Jump
        Dim sSelRnd As String = selRnd   'Round selected as a filter
        Dim sSelDV As String = selDv    'Div selected as a filter
        Dim sRndsSlalomOffered = RndsSlalomOffered
        Dim sRndsTrickOffered = RndsTrickOffered
        Dim sRndsJumpOffered = RndsJumpOffered
        Dim sRndsThisEvent As String = ""  'generic form of RndsSSlalomOffered, etc.
        Dim sRoundsHTML As String = ""  'string of <td>Rnd " & i & "</td> one for each round in an event
        Dim sRndCols As Int16 = 0  'Number of <td></td> sections in the table based on rounds offered + one column for Name and best score
        '        Dim sRound As String = ""  'Round in which best score was achieved
        Dim sSkierName As String = ""
        Dim sEventScoreDesc As String = ""
        Dim sEventScoreDescMetric As String = ""
        Dim sEventScoreDescImperial As String = ""
        Dim sEventScore As String = ""
        Dim i As Integer = 0
        Dim j As Integer = 0
        Dim sMemberID As String = ""
        Dim stmpMemberID As String = ""
        Dim sDv As String = ""
        Dim sTmpDv As String = ""
        Dim sCurRnd As String = ""
        Dim sTmpRnd As String = ""
        Dim sEventClass As String = ""
        Dim sEventGroup As String = ""
        Dim sCity As String = ""
        Dim sState As String = ""
        Dim sFederation As String = ""
        Dim sRankingScore As String = ""
        Dim sNopsScore As String = ""
        Dim sUseNOPS As Int16 = UseNOPS
        Dim suUseTeams As Int16 = UseTeams
        Dim sSlalomHeader As String = ""
        Dim sTrickHeader As String = ""
        Dim sUnit As String = ""
        Dim sJumpHeader As String = ""
        Dim sLine As New StringBuilder
        Dim sMultiRndScores As String = ""
        Dim sSql As String = ""
        Dim sShowBuoys As String = ""
        Dim sTVidAvail As String = ""
        Dim sHasVideo As String = ""
        Dim sScoreFeet As String = ""
        Dim sScoreMeters As String = ""
        Dim sMasterTable As New StringBuilder
        Dim sDvTable As New StringBuilder
        Dim sSkierLink As String = ""


        Select Case selEvent
            Case "S"
                sSelEvent = "Slalom"
                sSql = "Select [SanctionID],[SkierName],[MemberId],[Div],[EventClass],[TeamCode],[Round],[NopsScore],[EventScore],[ScoreRunoff],[Buoys] "
                sSql += " ,[EventScoreDesc],[EventScoreDescMeteric],[EventScoreDescImperial],[InsertDate] "
                sSql += " From [LiveWebScoreboard].[dbo].[vSlalomResults] Where SanctionID = ? and Event = ? "
                If sSelRnd <> "0" Then
                    sSql += " And [Round] = ? "
                Else
                    ' Exclude runoffs when showing all rounds -- later displayed with respective rnd/div
                    sSql += " And [Round] <> 25 "
                End If
                If UCase(sSelDV) <> "ALL" Then
                    sSql += " And [Div] = ? "
                End If
                sSql += " Order By [Round], [Div], [EventScore] desc"
                sUnit = " Buoys"
                If sSelRnd = "0" Then
                    sRndCols = CStr(CInt(sRndsSlalomOffered))
                    For j = 1 To RndsSlalomOffered
                        sRoundsHTML += "<td><b>Rnd&nbsp;" & j & "</b></td>"
                    Next
                    sRoundsHTML += "</tr>"
                Else
                    sRoundsHTML += "<td>Class</td><td>NOPS</td><td colspan=""2"">Details</td>"
                    sRndCols = "6"
                End If


            Case "T"
                sSelEvent = "Trick"
                sSql = "Select [SanctionID],[SkierName],[MemberId],[Div],[EventClass],[TeamCode],[Round],[NopsScore],[EventScore],[ScoreRunoff] "
                sSql += " ,[EventScoreDesc],[Pass1VideoUrl],[Pass2VideoUrl],[InsertDate] "
                sSql += " From [LiveWebScoreboard].[dbo].[vTrickResults]  Where SanctionID = ? and Event = ? "
                If sSelRnd <> "0" Then
                    sSql += " And [Round] = ? "
                Else
                    ' Exclude runoffs
                    sSql += " And [Round] <> 25 "
                End If
                If UCase(sSelDV) <> "ALL" Then
                    sSql += " And [Div] = ? "
                End If

                sSql += " Order By [Round], [Div], [EventScore] desc"
                sRndsThisEvent = sRndsTrickOffered
                sUnit = " Points"
                If sSelRnd = "0" Then
                    sRndCols = CStr(CInt(sRndsTrickOffered))  'Rnds + name + 2 for BestRnd
                    For j = 1 To RndsTrickOffered
                        sRoundsHTML += "<td><b>Rnd&nbsp;" & j & "</b></td>"
                    Next
                    sRoundsHTML += "</tr>"
                Else
                    sRoundsHTML += "<td>Rnd " & sSelRnd & "</td><td> Points </td><td>NOPS</td><td>Details</td><td>Time</td>"
                    sRndCols = "6"
                End If

            Case "J"
                sSelEvent = "Jump"
                sSql = "Select [SanctionID],[SkierName],[MemberId],[Div],[EventClass],[TeamCode],[Round],[NopsScore],[EventScore],[ScoreRunoff] "
                sSql += " ,[EventScoreDesc],[ScoreFeet],[ScoreMeters],[InsertDate] "
                sSql += " From [LiveWebScoreboard].[dbo].[vJumpResults]  Where SanctionID = ? and Event = ? "
                If sSelRnd <> "0" Then
                    sSql += " And [Round] = ? "
                Else
                    ' Exclude runoffs
                    sSql += " And [Round] <> 25 "
                End If
                If UCase(sSelDV) <> "ALL" Then
                    sSql += " And [Div] = ? "
                End If
                sSql += " Order By [Round], [Div], [EventScore] desc"
                sRndsThisEvent = sRndsJumpOffered
                sUnit = " Feet"
                If sSelRnd = "0" Then
                    sRndCols = CStr(CInt(sRndsTrickOffered))  'Rnds + name + 2 for BestRnd
                    For j = 1 To RndsJumpOffered
                        sRoundsHTML += "<td><b>Rnd&nbsp;" & j & "</b></td>"
                    Next
                    sRoundsHTML += "</tr>"
                Else
                    sRoundsHTML += "<td>Rnd " & sSelRnd & "</td><td>Class</td><td> Ft/M </td><td>NOPS</td><td>Details</td><td>Time</td>"
                    sRndCols = "6"
                End If
            Case Else  'Load all by default
                sMsg = "<td>Event code out of range</td></tr>"
                Return sMsg
                Exit Function
        End Select
        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: GetRunOrder could not get connection string."
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim cmdRead As New OleDb.OleDbCommand
        cmdRead.CommandType = CommandType.Text
        cmdRead.CommandText = sSql
        cmdRead.Parameters.Add("@InSanctionID", OleDb.OleDbType.VarChar)
        cmdRead.Parameters("@InSanctionID").Size = 6
        cmdRead.Parameters("@InSanctionID").Value = sSanctionID
        cmdRead.Parameters("@InSanctionID").Direction = ParameterDirection.Input

        cmdRead.Parameters.Add("@InEvCode", OleDb.OleDbType.VarChar)
        cmdRead.Parameters("@InEvCode").Size = 12
        cmdRead.Parameters("@InEvCode").Value = sSelEvent
        cmdRead.Parameters("@InEvCode").Direction = ParameterDirection.Input

        If sSelRnd <> "0" Then

            cmdRead.Parameters.Add("@InRnd", OleDb.OleDbType.Char)
            cmdRead.Parameters("@InRnd").Size = 1
            cmdRead.Parameters("@InRnd").Value = sSelRnd    '0 = All Rounds    sSelRnd
            cmdRead.Parameters("@InRnd").Direction = ParameterDirection.Input
        End If

        If UCase(sSelDV) <> "ALL" Then
            cmdRead.Parameters.Add("@InDV", OleDb.OleDbType.VarChar)
            cmdRead.Parameters("@InDV").Size = 3
            cmdRead.Parameters("@InDV").Value = sSelDV   'This is the division selected for display.  sDv is the division in which the skier is performing.
            cmdRead.Parameters("@InDV").Direction = ParameterDirection.Input
        End If

        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then

                        Do While MyDataReader.Read()
                            sSanctionID = CStr(MyDataReader.Item("SanctionID"))
                            sSkierName = CStr(MyDataReader.Item("SkierName"))

                            sSkierName = MyDataReader.Item("SkierName")

                            If Not IsDBNull(MyDataReader.Item("MemberID")) Then
                                sMemberID = MyDataReader.Item("MemberID")
                            Else
                                sMemberID = ""
                            End If

                            If Not IsDBNull(MyDataReader.Item("DiV")) Then
                                sDv = CStr(MyDataReader.Item("DiV"))
                            Else
                                sDv = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("EventClass")) Then
                                sEventClass = MyDataReader.Item("EventClass")
                            Else
                                sEventClass = ""
                            End If
                            'team
                            If Not IsDBNull(MyDataReader.Item("Round")) Then
                                sCurRnd = CStr(MyDataReader.Item("Round"))
                            Else
                                sCurRnd = ""
                            End If

                            If Not IsDBNull(MyDataReader.Item("EventScore")) Then
                                sEventScore = MyDataReader.Item("EventScore")
                            Else
                                sEventScore = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("NOPSScore")) Then
                                sNopsScore = MyDataReader.Item("NOPSScore")
                            Else
                                sNopsScore = ""
                            End If

                            If Not IsDBNull(MyDataReader.Item("EventScoreDesc")) Then
                                sEventScoreDesc = MyDataReader.Item("EventScoreDesc")
                            Else
                                sEventScoreDesc = ""
                            End If


                            If selEvent = "S" Then  'fields specific to slalom event

                                If Not IsDBNull(MyDataReader.Item("EventScoreDescMeteric")) Then
                                    sEventScoreDescMetric = MyDataReader.Item("EventScoreDescMeteric")
                                Else
                                    sEventScoreDescMetric = ""
                                End If
                                If Not IsDBNull(MyDataReader.Item("EventScoreDescImperial")) Then
                                    sEventScoreDescImperial = MyDataReader.Item("EventScoreDescImperial")
                                Else
                                    sEventScoreDescImperial = ""
                                End If
                                'Show best score only for B1 and G1 slalom divisions
                                '                           If (sDv = "B1" Or sDv = "G1")  Then
                                '                               sShowBuoys = sScoreBest & " Buoys"
                                '                           Else
                                '                               sShowBuoys = ""
                                '                           End If
                            End If 'end slalom specific fields

                            sHasVideo = ""

                            If selEvent = "T" Then 'ONLY for Trick - Show trick video flag if available- 
                                If Not IsDBNull(MyDataReader.Item("Pass1VideoURL")) Then
                                    sTVidAvail = "Y"
                                End If

                                If Not IsDBNull(MyDataReader.Item("Pass2VideoURL")) Then
                                    sTVidAvail = "Y"
                                End If
                                If sTVidAvail = "Y" Then
                                    sHasVideo = "<img src=""Images/Flag-green16.png"" alt=""Trick Video Available"" title=""Trick Video Available"" />"
                                End If
                            End If 'end of trick specific fields

                            If selEvent = "J" Then 'Jump Specific fields

                                If Not IsDBNull(MyDataReader.Item("ScoreFeet")) Then
                                    sScoreFeet = MyDataReader.Item("ScoreFeet")
                                Else
                                    sScoreFeet = ""
                                End If

                                If Not IsDBNull(MyDataReader.Item("ScoreMeters")) Then
                                    sScoreMeters = MyDataReader.Item("ScoreMeters")
                                Else
                                    sScoreMeters = ""
                                End If
                            End If 'End jump specific fields

                            'Make skier name link
                            sSkierLink = "<a runat = ""server""  href=""Trecap?SID=" & sSanctionID & "&SY=" & sYrPkd & "&MID=" & sMemberID & "&DV=" & sDv & "&EV=S&TN=" & sTName & ""
                            sSkierLink += "&FC=LBSP&FT=0&RP=" & sSelRnd & "&UN=0&UT=0&SN=" & sSkierName & """ ><b>" & sSkierName & "</b></a>"


                            If sTmpRnd = "" Then
                                'Make first round table with proper header
                                sMasterTable.Append("<table class=""table table-striped division-section"" style=""margin-bottom: 1rem;"">")
                                sMasterTable.Append("<tr class=""table-header-row""><td colspan=""2""><b>" & UCase(sSelEvent) & " " & sDv & " — ROUND " & sCurRnd & " — Sort by: ROUND</b></td></tr>")
                                ' Add runoff row for new division (always show if specific round selected, otherwise only on first round)
                                Dim shouldShowRunoff As Boolean = selEvent <> "O" And ((sSelRnd <> "0") Or (sTmpRnd = ""))
                                If shouldShowRunoff Then
                                    Dim sRunoffSectionContent As String = ModDataAccessPro.GetRunoffSection(sSanctionID, sSelEvent, sDv)
                                    If sRunoffSectionContent <> "" And Not sRunoffSectionContent.Contains("No RunOffs Found") And Not sRunoffSectionContent.Contains("Error") Then
                                        sMasterTable.Append("<tr><td colspan=""2"" style=""background-color: #ffebee; padding: 8px; font-style: italic;"">" & sRunoffSectionContent & "</td></tr>")
                                    End If
                                End If
                                sTmpRnd = sCurRnd
                                sTmpDv = sDv
                            End If
                            If sTmpRnd = sCurRnd Then

                                If sTmpDv = sDv Then
                                    sMasterTable.Append("<tr><td width=""35%"">" & sSkierLink & "</td><td width=""65%""><b>" & sEventScoreDesc & "</b></td></tr>")

                                Else 'division changed - add skier row with division info
                                    sMasterTable.Append("<tr><td width=""35%"">" & sSkierLink & " (" & sDv & ")</td><td width=""65%""><b>" & sEventScoreDesc & "</b></td></tr>")
                                    sTmpDv = sDv
                                End If

                            Else 'Round changed -  start new round table
                                sMasterTable.Append("</table>")
                                sMasterTable.Append("<table class=""table table-striped division-section"" style=""margin-bottom: 1rem;"">")
                                sMasterTable.Append("<tr class=""table-header-row""><td colspan=""2""><b>" & UCase(sSelEvent) & " " & sDv & " — ROUND " & sCurRnd & " — Sort by: ROUND</b></td></tr>")
                                ' Add runoff row - always show if specific round selected, otherwise only if division changed
                                Dim shouldShowRunoff As Boolean = selEvent <> "O" And ((sSelRnd <> "0") Or (sTmpDv <> sDv))
                                If shouldShowRunoff Then
                                    Dim sRunoffSectionContent As String = ModDataAccessPro.GetRunoffSection(sSanctionID, sSelEvent, sDv)
                                    If sRunoffSectionContent <> "" And Not sRunoffSectionContent.Contains("No RunOffs Found") And Not sRunoffSectionContent.Contains("Error") Then
                                        sMasterTable.Append("<tr><td colspan=""2"" style=""background-color: #ffebee; padding: 8px; font-style: italic;"">" & sRunoffSectionContent & "</td></tr>")
                                    End If
                                End If
                                sMasterTable.Append("<tr><td width=""35%"">" & sSkierLink & "</td><td width=""65%""><b>" & sEventScoreDesc & "</b></td></tr>")
                                sTmpDv = sDv
                                sTmpRnd = sCurRnd

                            End If

                        Loop
                        sMasterTable.Append("</table>")
                    Else  'No records
                        'Don't return anything. frontend should show message
                    End If

                End Using
            Catch ex As Exception
                sMsg = "Error at LeaderBoardRound"
                sErrDetails = sMsg & " " & ex.Message & " " & ex.StackTrace
            End Try

        End Using

        If Len(sMsg) > 2 Then
            Return sMsg
        Else
            '          sMsg = sMasterTable.ToString()
            Return sMasterTable.ToString()
        End If
    End Function
    Public Function LeaderBoardBestRndLeft(ByVal SanctionID As String, ByVal SkiYr As String, ByVal TName As String, ByVal selEvent As String, ByVal selDv As String, ByVal selRnd As String, ByVal RndsSlalomOffered As String, ByVal RndsTrickOffered As String, ByVal RndsJumpOffered As String, ByVal UseNOPS As Int16, ByVal UseTeams As Int16, ByVal selFormat As String, ByVal DisplayMetric As Int16) As String
        'This function is run for each event selected based on code in TLeaderBoard_Load and Btn_Update
        Dim sReturn As String = ""
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sStopHere As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sYrPkd As String = SkiYr
        Dim sTName As String = TName
        Dim sSelEvent As String = ""  'Event Selected as Slalom Trick, Jump
        Dim sEventPkd As String = selEvent 'Event as S, T, or J
        Dim sSelRnd As String = selRnd   'Round selected as a filter
        Dim sSelDV As String = selDv    'Div selected as a filter
        Dim sRndsSlalomOffered = RndsSlalomOffered
        Dim sRndsTrickOffered = RndsTrickOffered
        Dim sRndsJumpOffered = RndsJumpOffered
        Dim sRndsThisEvent As String = ""  'generic form of RndsSSlalomOffered, etc.
        Dim sRoundsHTML As String = ""  'string of <td>Rnd " & i & "</td> one for each round in an event
        Dim sRndCols As Int16 = 0  'Number of <td></td> sections in the table based on rounds offered + one column for Name and best score
        Dim sRound As String = ""  'Round in which best score was achieved
        Dim sSkierName As String = ""
        Dim sMemberID As String = ""
        Dim sEventScoreDesc As String = ""
        Dim sScoreBest As String = ""
        Dim sEventScore As String = ""
        Dim stmpMemberID As String = ""
        Dim i As Integer = 0
        Dim j As Integer = 0
        Dim sDv As String = ""
        Dim sTmpDv As String = ""
        Dim sEventClass As String = ""
        Dim sEventGroup As String = ""
        Dim sCity As String = ""
        Dim sState As String = ""
        Dim sFederation As String = ""
        Dim sRankingScore As String = ""
        Dim sNopsScore As String = ""
        Dim sUseNOPS As Int16 = UseNOPS
        Dim suUseTeams As Int16 = UseTeams
        Dim sSlalomHeader As String = ""
        Dim sTrickHeader As String = ""
        Dim sUnit As String = ""
        Dim sJumpHeader As String = ""
        Dim sLine As New StringBuilder
        Dim sMultiRndScores As String = ""
        Dim sSql As String = ""
        Dim sShowBuoys As String = ""
        Dim sTVidAvail As String = ""
        Dim sHasVideo As String = ""
        Select Case selEvent
            Case "S"
                sSelEvent = "Slalom"
                sSql = " PrSlalomScoresBestByDiv"
                sUnit = " Buoys"
                If sSelRnd = "0" Then
                    sRndCols = CStr(CInt(sRndsSlalomOffered) + 1)
                    For j = 1 To RndsSlalomOffered
                        sRoundsHTML += "<td>Rnd&nbsp;" & j & "</td>" 'completes the event header with appropriate number of rounds columns
                    Next
                    sRoundsHTML += "</tr>"
                Else
                    sRoundsHTML += "<td>Class</td><td>NOPS</td><td colspan=""2"">Details</td>"
                    sRndCols = "6"
                End If


            Case "T"
                sSelEvent = "Trick"
                sSql = "PrTrickScoresBestByDiv"
                sRndsThisEvent = sRndsTrickOffered
                sUnit = " Points"
                If sSelRnd = "0" Then
                    sRndCols = CStr(CInt(sRndsTrickOffered) + 1)  'Rnds + name + 2 for BestRnd
                    For j = 1 To RndsTrickOffered
                        sRoundsHTML += "<td>Rnd&nbsp;" & j & "</td>"  'completes the event header with appropriate number of rounds columns
                    Next
                    sRoundsHTML += "</tr>"
                Else
                    sRoundsHTML += "<td>Rnd " & sSelRnd & "</td><td> Points </td><td>NOPS</td><td>Details</td><td>Time</td>"
                    sRndCols = "6"
                End If

            Case "J"
                sSelEvent = "Jump"
                sSql = "PrJumpScoresBestByDiv"
                sRndsThisEvent = sRndsJumpOffered
                sUnit = " Feet"
                If sSelRnd = "0" Then
                    sRndCols = CStr(CInt(sRndsTrickOffered) + 1)  'Rnds + name + 2 for BestRnd
                    For j = 1 To RndsJumpOffered
                        sRoundsHTML += "<td>Rnd&nbsp;" & j & "</td>"    'completes the event header with appropriate number of rounds columns
                    Next
                    sRoundsHTML += "</tr>"
                Else
                    sRoundsHTML += "<td>Rnd " & sSelRnd & "</td><td>Class</td><td> Ft/M </td><td>NOPS</td><td>Details</td><td>Time</td>"
                    sRndCols = "6"
                End If
            Case Else  'Load all by default
                sMsg = "<td>Event Code out Of range</td></tr>"
                Return sMsg
                Exit Function
        End Select
        '       sLine.Append("<Table Class=""table  table-bordered border-primary "">") '& sJumpHeader)  
        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: GetRunOrder could not get connection string."
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim cmdRead As New OleDb.OleDbCommand
        cmdRead.CommandType = CommandType.StoredProcedure
        cmdRead.CommandText = sSql
        cmdRead.Parameters.Add("@InSanctionID", OleDb.OleDbType.VarChar)
        cmdRead.Parameters("@InSanctionID").Size = 6
        cmdRead.Parameters("@InSanctionID").Value = sSanctionID
        cmdRead.Parameters("@InSanctionID").Direction = ParameterDirection.Input

        '       cmdRead.Parameters.Add("@InEvCode", OleDb.OleDbType.VarChar)
        '       cmdRead.Parameters("@InEvCode").Size = 12
        '       cmdRead.Parameters("@InEvCode").Value = sPREventCode
        '       cmdRead.Parameters("@InEvCode").Direction = ParameterDirection.Input

        '       cmdRead.Parameters.Add("@InRnd", OleDb.OleDbType.Char)
        '       cmdRead.Parameters("@InRnd").Size = 1
        '       cmdRead.Parameters("@InRnd").Value = "0"    '0 = All Rounds    sSelRnd
        ''        cmdRead.Parameters("@InRnd").Direction = ParameterDirection.Input

        cmdRead.Parameters.Add("@InDV", OleDb.OleDbType.VarChar)
        cmdRead.Parameters("@InDV").Size = 3
        cmdRead.Parameters("@InDV").Value = sSelDV   'This is the division selected for display.  sDv is the division in which the skier is performing.
        cmdRead.Parameters("@InDV").Direction = ParameterDirection.Input

        '    cmdRead.Parameters.Add("@InGroup", OleDb.OleDbType.VarChar)
        '    cmdRead.Parameters("@InGroup").Size = 3
        '    cmdRead.Parameters("@InGroup").Value = selDv   'sEventGroup
        '    cmdRead.Parameters("@InGroup").Direction = ParameterDirection.Input

        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()
                            sSanctionID = CStr(MyDataReader.Item("SanctionID"))
                            sSkierName = CStr(MyDataReader.Item("SkierName"))

                            If Not IsDBNull(MyDataReader.Item("DiV")) Then
                                sDv = CStr(MyDataReader.Item("DiV"))
                            Else
                                sDv = ""
                            End If

                            If Not IsDBNull(MyDataReader.Item("Round")) Then
                                sRound = CStr(MyDataReader.Item("Round"))
                            Else
                                sRound = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("MemberID")) Then
                                sMemberID = MyDataReader.Item("MemberID")
                            Else
                                sMemberID = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("ScoreBest")) Then
                                sScoreBest = MyDataReader.Item("ScoreBest")
                            Else
                                sScoreBest = ""
                            End If
                            'Show best score only for B1 and G1 slalom divisions
                            If (sDv = "B1" Or sDv = "G1") And selEvent = "S" Then
                                sShowBuoys = sScoreBest & " Buoys"
                            Else
                                sShowBuoys = ""
                            End If






                            If Not IsDBNull(MyDataReader.Item("EventClass")) Then
                                sEventClass = MyDataReader.Item("EventClass")
                            Else
                                sEventClass = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("City")) Then
                                sCity = MyDataReader.Item("City")
                            Else
                                sCity = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("State")) Then
                                sState = MyDataReader.Item("State")
                            Else
                                sState = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("Federation")) Then
                                sFederation = MyDataReader.Item("Federation")
                            Else
                                sFederation = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("RankingScore")) Then
                                sRankingScore = MyDataReader.Item("RankingScore")
                            Else
                                sRankingScore = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("NOPSScore")) Then
                                sNopsScore = MyDataReader.Item("NOPSScore")
                            Else
                                sNopsScore = ""
                            End If

                            sHasVideo = ""
                            'ONLY for Trick - Show trick video flag if available- 
                            If selEvent = "T" Then
                                If Not IsDBNull(MyDataReader.Item("Pass1VideoURL")) Then
                                    sTVidAvail = "Y"
                                End If

                                If Not IsDBNull(MyDataReader.Item("Pass2VideoURL")) Then
                                    sTVidAvail = "Y"
                                End If
                                If sTVidAvail = "Y" Then
                                    sHasVideo = "<img src=""Images/Flag-green16.png"" alt=""Trick Video Available"" title=""Trick Video Available, Select skier on Entry List"" />"
                                End If
                            End If

                            If sTmpDv = "" Then
                                'Add the division header for first division
                                ' Add round info if specific round is selected
                                Dim sRoundInfo As String = ""
                                If sSelRnd <> "0" And sSelRnd <> "" Then
                                    sRoundInfo = "Round " & sSelRnd & " -"
                                End If
                                sLine.Append("<table class=""table table-striped division-section"" style=""margin-bottom: 1rem;""><tr class=""table-header-row""><td width=""35%""><b>" & sSelEvent & " " & sDv & " - " & sRoundInfo & " Sort by: " & "</b></td>" & sRoundsHTML)
                                sTmpDv = sDv
                            End If
                            'Get the first MemberID' first record in first pass through data
                            If stmpMemberID = "" Then stmpMemberID = sMemberID

                            If sTmpDv = sDv Then 'Continue in same Division
                                'Add the data line
                                sLine.Append("<tr><td><a runat=""server""  href=""Trecap?SID=" & sSanctionID & "&SY=" & sYrPkd & "&MID=" & sMemberID & "&DV=" & sTmpDv & "&EV=" & sEventPkd & "&TN=" & sTName & "")
                                sLine.Append("&FC=LB&FT=0&RP=1&UN=0&UT=0&SN=" & sSkierName & """ ><b>" & sSkierName & "</b></a><b> " & sShowBuoys & "</b>" & sHasVideo & "</td>")   '   
                                sMultiRndScores = ModDataAccess3.LBGetRndScores(sSanctionID, sMemberID, sSelEvent, sDv, sSelRnd, sRound, sRndsSlalomOffered, sRndsTrickOffered, sRndsJumpOffered, sNopsScore)
                                If sMultiRndScores <> "Error" Then
                                    sLine.Append(sMultiRndScores)
                                    sMultiRndScores = ""
                                Else
                                    'FIX THIS ERROR TRAP
                                End If
                            Else 'Division changed.

                                sLine.Append("</table>")
                                stmpMemberID = sMemberID
                                sTmpDv = sDv
                                'start new division header
                                sLine.Append("<table><tr><td colspan=""" & sRndCols & """><b> &nbsp;" & sSelEvent & " " & sDv & "</b></td></tr")
                                sLine.Append("<table><tr><td width=""25%""><b> Leader Board </b></td>" & sRoundsHTML)
                                'Add the data line
                                sLine.Append("<tr><td><a runat=""server""  href=""Trecap?SID=" & sSanctionID & "&SY=" & sYrPkd & "&MID=" & stmpMemberID & "&DV=" & sTmpDv & "&EV=" & sEventPkd & "&TN=" & sTName & "")
                                sLine.Append("&FC=LB&FT=0&RP=1&UN=0&UT=0&SN=" & sSkierName & """ ><b>" & sSkierName & "</b></a><b> " & sShowBuoys & "</b>" & sHasVideo & "</td>")   '   
                                sMultiRndScores = ModDataAccess3.LBGetRndScores(sSanctionID, sMemberID, sSelEvent, sDv, sSelRnd, sRound, sRndsSlalomOffered, sRndsTrickOffered, sRndsJumpOffered, sNopsScore)
                                If sMultiRndScores <> "Error" Then
                                    sLine.Append(sMultiRndScores)
                                Else
                                    'FIX THIS ERROR TRAP
                                End If
                            End If

                        Loop
                        'Close the DV table for the specified division
                        sLine.Append("</table>")
                    Else
                        '      sLine.Append("<tr  class=""table-info""><td> " & sSkierName & "</td><td>No Scores</td></tr></table>")
                    End If

                End Using
            Catch ex As Exception
                sMsg = "Error at LeaderBoardBestRndLeft"
                sErrDetails = sMsg & " " & ex.Message & " " & ex.StackTrace
            End Try

        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
        Else
            sMsg = sLine.ToString()
            Return sLine.ToString()
        End If
    End Function
    Friend Function GetEntryList(ByVal SanctionID As String, ByVal TournName As String, YrPkd As String) As String
        'As of v3.1.5  uses TRecap.aspx instead of TIndScores.aspx to display skier score detail.
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSanctionID As String = Trim(SanctionID)
        Dim sTName As String = TournName
        Dim sAgeGroup As String = ""
        Dim sTmpSkierID As String = ""
        Dim sTmpAgeGroup As String = ""
        Dim sTmpEvent As String = ""
        Dim sTmpEventClass As String = ""
        Dim sYrPkd As String = YrPkd
        Dim sEvent As String = ""
        Dim sEventClass As String = ""
        Dim sTeam As String = ""
        Dim sTmpTeam As String = ""
        Dim sShoTeam As String = ""
        Dim sEnteredIn As String = ""
        Dim sSQL As String = ""
        Dim sWhere As String = ""
        Dim sOR As String = ""
        Dim sOrderBy As String = ""
        Dim sTmpReadyToSki As String = ""
        Dim sReadyToSki As String = "N"
        Dim sFlag As String = ""
        Dim sCaption As String = " Cls "
        Dim sCollegiate As Boolean = False

        Dim sTmpMemberID As String = ""
        Dim sEventsEntered As String = ""
        Dim sShowVidLink As String = ""

        Dim sSkierRow As New StringBuilder

        Dim sSkierLink As String = ""
        If Mid(sSanctionID, 3, 1) = "U" Then
            sCollegiate = True
            sCaption = " Team "
        End If
        Dim sSQLBuilder As New StringBuilder
        sSQLBuilder.Append("SELECT TR.SkierName, TR.SanctionId, TR.MemberId, TR.AgeGroup, TR.AgeGroup AS Div, TR.City, TR.State, TR.Federation, ER.Event, ")
        sSQLBuilder.Append("TR.ReadyToSki, ER.TeamCode AS Team, CASE WHEN COALESCE  ")
        sSQLBuilder.Append("((SELECT MIN(PK) AS TVPK  ")
        sSQLBuilder.Append("FROM      TrickVideo AS TV  ")
        sSQLBuilder.Append("WHERE   TV.SanctionId = TR.SanctionId AND TV.MemberId = TR.MemberId AND TV.AgeGroup = TR.AgeGroup AND (TV.Pass1VideoUrl IS NOT NULL OR  ")
        sSQLBuilder.Append("TV.Pass2VideoUrl IS NOT NULL)), 0) > 0 THEN 'Y' ELSE 'N' END AS TrickVideoAvailable  ")
        sSQLBuilder.Append("FROM     dbo.TourReg AS TR INNER JOIN  ")
        sSQLBuilder.Append("dbo.EventReg AS ER ON ER.SanctionId = TR.SanctionId AND ER.MemberId = TR.MemberId AND ER.AgeGroup = TR.AgeGroup  ")

        sSQLBuilder.Append("WHERE  tr.SanctionID = '" & sSanctionID & "' and ((TR.Withdrawn IS NULL) OR(TR.Withdrawn = 'N') OR(TR.Withdrawn = ''))  ")
        sSQLBuilder.Append("order by tr.SkierName  ")
        sSQL = sSQLBuilder.ToString()
        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If

        Catch ex As Exception
            sMsg = "Can not access data"
            sErrDetails = "GetEntryList at Conn " & ex.Message & "  " & ex.StackTrace
        End Try

        Dim FirstPass As Boolean = True
        Dim sSkierName As String = ""
        Dim sMemberID As String = ""
        Dim sLblText As String = ""
        Dim sLine As String = ""
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim sTVidAvail As String = "N"
        Dim sHasVideo As String = ""
        Dim sTSB As New StringBuilder
        Dim sText As String = ""
        sTSB.Append("<table class=""table table-striped border-1"" style=""width: auto; margin: 2rem auto;"" cellpadding=""5"">")
        sTSB.Append("<tr style=""background-color: #d6eded;""><td><b>Select Skier</b></td><td><b>Events Entered</b></td><td><b>Team</b></td><td><b>OK2Ski</b></td></tr>")
        Dim cmdRead As New OleDb.OleDbCommand
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.CommandText = sSQL
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()

                            sSanctionID = CStr(MyDataReader.Item("SanctionID"))
                            sSkierName = CStr(MyDataReader.Item("SkierName"))
                            sMemberID = CStr(MyDataReader.Item("MemberID"))
                            sAgeGroup = CStr(MyDataReader.Item("AgeGroup"))
                            sEvent = Left(CStr(MyDataReader.Item("Event")), 1)
                            '                           sEventClass = CStr(MyDataReader.Item("EventClass"))
                            If UCase(sEvent) = "TRICK" Then
                                sTVidAvail = CStr(MyDataReader.Item("TrickVideoAvailable"))
                                sHasVideo = ""

                            End If
                            sTeam = "Not Set"
                            If Not IsDBNull(MyDataReader.Item("Team")) Then
                                If Len(Trim(MyDataReader.Item("Team"))) > 1 Then  'Make sure Team is not NULL or empty string
                                    sTeam = MyDataReader.Item("Team")
                                End If
                            End If
                            sReadyToSki = MyDataReader.Item("ReadyToSki")  ' holds Y or N


                            'set up first pass


                            If sTmpMemberID = "" Then  'First record 

                                sSkierLink = "<a runat=""server""  href=""Trecap?SID=" & sSanctionID & "&SY=" & sYrPkd & "&MID=" & sMemberID & "&DV=" & sAgeGroup & "&EV=A"
                                sSkierLink += "&FC=EL&FT=1&RP=0&UN=0&UT=0&TN=" & sTName & "&SN=" & sSkierName & """ ><b>" & sSkierName & "</b></a>"
                                sFlag = "&nbsp; &nbsp;" & sReadyToSki

                                sTmpMemberID = sMemberID
                            End If
                            If sTmpMemberID = sMemberID Then
                                'Store other data in variables
                                sEventsEntered += ", " & sAgeGroup & " " & sEvent
                                If sReadyToSki = "N" Then
                                    sFlag = " &nbsp; ! SEE REGISTRAR ! &nbsp;"
                                End If
                                sShoTeam = sTeam
                                If UCase(sEvent) = "TRICK" Then
                                    If sTVidAvail = "Y" Then
                                        sHasVideo = "<img src=""Images/Flag-green16.png"" alt=""Trick Video Available"" title=""Trick Video Available, Select skier on Entry List"" />"
                                    End If
                                End If
                            Else  'new skier
                                'Close out previous skier
                                sLine = "<tr><td>" & sSkierLink & " " & sHasVideo & " </td><td>" & sEventsEntered & "</td><td>" & sShoTeam & "</td><td>" & sFlag & "</td></tr>"
                                sTSB.Append(sLine)
                                'Start new skier
                                sTmpMemberID = sMemberID
                                sSkierLink = "<a runat=""server""  href=""Trecap?SID=" & sSanctionID & "&SY=" & sYrPkd & "&MID=" & sMemberID & "&DV=" & sAgeGroup & "&EV=A"
                                sSkierLink += "&FC=EL&FT=1&RP=0&UN=0&UT=0&TN=" & sTName & "&SN=" & sSkierName & """ ><b>" & sSkierName & "</b></a>"
                                sEventsEntered = ""

                                'Store other data in variables
                                sEventsEntered += sAgeGroup & " " & sEvent & " "
                                sFlag = "&nbsp; &nbsp;" & sReadyToSki
                                If sReadyToSki = "N" Then
                                    sFlag = " &nbsp; ! SEE REGISTRAR ! &nbsp;"
                                End If
                                sShoTeam = sTeam
                                If UCase(sEvent) = "TRICK" Then
                                    If sTVidAvail = "Y" Then
                                        sHasVideo = "<img src=""Images/Flag-green16.png"" alt=""Trick Video Available"" title=""Trick Video Available, Select skier on Entry List"" />"
                                    End If
                                End If
                            End If

                        Loop
                        sLine = "<tr><td>" & sSkierLink & " " & sHasVideo & " </td><td>" & sEventsEntered & "</td><td>" & sShoTeam & "</td><td>" & sFlag & "</td></tr>"
                        sTSB.Append(sLine)


                    Else
                        sTSB.Append("<tr><td colspan=""4"">No Skiers Found.</td></tr>")
                    End If 'end of has rows
                End Using
            Catch ex As Exception
                sMsg += "Error: at GetEntryList"
                sErrDetails = "GetEntryList Caught: " & ex.Message & " " & ex.StackTrace & "<br>SQL= " & sSQL

            Finally
                sText = sTSB.ToString() & "</table>"
            End Try

        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        Return sText
    End Function
    Friend Function GetEntryListOLD(ByVal SanctionID As String, ByVal TournName As String, YrPkd As String) As String
        'As of v3.1.5  uses TRecap.aspx instead of TIndScores.aspx to display skier score detail.
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSanctionID As String = Trim(SanctionID)
        Dim sTName As String = TournName
        Dim sAgeGroup As String = ""
        Dim sTmpSkierID As String = ""
        Dim sTmpAgeGroup As String = ""
        Dim sTmpEvent As String = ""
        Dim sTmpEventClass As String = ""
        Dim sYrPkd As String = YrPkd
        Dim sEvent As String = ""
        Dim sEventClass As String = ""
        Dim sTeam As String = ""
        Dim sTmpTeam As String = ""
        Dim sShoTeam As String = ""
        Dim sEnteredIn As String = ""
        Dim sSQL As String = ""
        Dim sWhere As String = ""
        Dim sOR As String = ""
        Dim sOrderBy As String = ""
        Dim sTmpReadyToSki As String = ""
        Dim sReadyToSki As String = "N"
        Dim sFlag As String = ""
        Dim sCaption As String = " Cls "
        Dim sCollegiate As Boolean = False
        Dim sSkierLink As String = ""
        If Mid(sSanctionID, 3, 1) = "U" Then
            sCollegiate = True
            sCaption = " Team "
        End If
        sSQL = "Select * from LivewebScoreBoard.dbo.vSkiersEntered Where SanctionID = '" & sSanctionID & "'  Order By SkierName "

        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If

        Catch ex As Exception
            sMsg = "Can not access data"
            sErrDetails = "GetEntryList at Conn " & ex.Message & "  " & ex.StackTrace
        End Try

        Dim FirstPass As Boolean = True
        Dim sSkierName As String = ""
        Dim sMemberID As String = ""
        Dim sLblText As String = ""
        Dim sLine As String = ""
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim sTVidAvail As String = "N"
        Dim sHasVideo As String = ""
        Dim sTableWidth As String = "100%"
        Dim sTSB As New StringBuilder
        Dim sText As String = ""
        sTSB.Append("<table class=""table table-striped border-1"" width=" & sTableWidth & " cellpadding=""5"">")
        '       sTSB.Append("<tr><td colspan=""4""><h4>Select a skier</h4></td></tr>")
        sTSB.Append("<tr><td><b>Select Skier</b></td><td><b>Age Group</b></td><td><b>Team</b></td><td><b>OK2Ski</b></td></tr>")
        Dim cmdRead As New OleDb.OleDbCommand
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.CommandText = sSQL
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()

                            sSanctionID = CStr(MyDataReader.Item("SanctionID"))
                            sSkierName = CStr(MyDataReader.Item("SkierName"))
                            sMemberID = CStr(MyDataReader.Item("MemberID"))
                            sAgeGroup = CStr(MyDataReader.Item("AgeGroup"))
                            sEvent = Left(CStr(MyDataReader.Item("Event")), 1)
                            sEventClass = CStr(MyDataReader.Item("EventClass"))
                            sTVidAvail = CStr(MyDataReader.Item("TrickVideoAvailable"))
                            sHasVideo = ""
                            If sTVidAvail = "Y" Then
                                sHasVideo = "<img src=""Images/Flag-green16.png"" alt=""Trick Video Available"" title=""Trick Video Available, Select skier on Entry List"" />"
                            End If
                            sTeam = "Not Set"
                            If Not IsDBNull(MyDataReader.Item("Team")) Then
                                If Len(Trim(MyDataReader.Item("Team"))) > 1 Then  'Make sure Team is not NULL or empty string
                                    sTeam = MyDataReader.Item("Team")
                                End If
                            End If
                            sReadyToSki = MyDataReader.Item("ReadyToSki")  ' holds Y or N

                            sSkierLink = "<a runat=""server""  href=""Trecap?SID=" & sSanctionID & "&SY=" & sYrPkd & "&MID=" & sMemberID & "&DV=" & sAgeGroup & "&EV=A"
                            sSkierLink += "&FC=EL&FT=1&RP=0&UN=0&UT=0&TN=" & sTName & "&SN=" & sSkierName & """ ><b>" & sSkierName & "</b></a>"


                            '                            If FirstPass = True Then  'Include the first record
                            '                                sTmpSkierID = sMemberID
                            '                                sTmpTeam = sTeam
                            '                                FirstPass = False
                            '                                sTmpReadyToSki = sReadyToSki
                            '                            End If
                            '                            If sTmpSkierID <> sMemberID Then 'combine all events entered for same skiers.  May be entered in more than one AgeGroup
                            If sReadyToSki = "N" Then
                                sFlag = " &nbsp; ! SEE REGISTRAR ! &nbsp;"
                            Else
                                sFlag = "&nbsp; &nbsp;" & sReadyToSki
                            End If
                            sShoTeam = sTeam
                            sLine = "<tr><td>" & sSkierLink & " " & sHasVideo & " </td><td>" & sAgeGroup & "</td><td>" & sShoTeam & "</td><td>" & sFlag & "</td></tr>"
                            '                              sLine = "<tr><td><a runat=""server"" href=""TIndScores.aspx?SID=" & sSanctionID & "&MID= " & sMemberID & "&SY= " & sYrPkd & "&TN=" & sTournName & "&EV=" & sEvent & "&N=" & sSkierName & "&DV=" & sAgeGroup & """>" & sSkierName & "</a>" & sHasVideo & " </td><td>" & sAgeGroup & "</td><td>" & sShoTeam & "</td><td>" & sFlag & "</td></tr>"
                            sTSB.Append(sLine)
                            '                                sTmpEvent = sEvent
                            '                                sTmpSkierID = sMemberID
                            '                                sTmpEventClass = sEventClass
                            '                                sTmpAgeGroup = sAgeGroup
                            '                            sTmpReadyToSki = sReadyToSki
                            '                            sEnteredIn = sEvent & " Cls " & sEventClass
                            sEnteredIn = sEvent & " "
                            sLine = ""
                            sFlag = ""
                            '                               sTmpTeam = sTeam
                            sShoTeam = ""
                            '                            End If

                        Loop
                    Else
                        sTSB.Append("<tr><td colspan=""4"">No Skiers Found.</td></tr>")
                    End If 'end of has rows
                End Using
            Catch ex As Exception
                sMsg += "Error: at GetEntryList"
                sErrDetails = "GetTournamentList Caught: " & ex.Message & " " & ex.StackTrace & "<br>SQL= " & sSQL

            Finally
                sText = sTSB.ToString() & "</table>"
            End Try

        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        Return sText
    End Function

    Friend Function RecapSlalom(ByVal SanctionID As String, ByVal MemberID As String, ByVal ageGroup As String, ByVal SkierName As String) As String
        'Pulled from wfwShowScoreRecap.php
        ' 
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sText As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sMemberID As String = MemberID
        Dim sAgeGroup As String = ageGroup
        Dim sSkierName As String = SkierName
        Dim sCity As String = ""
        Dim sState As String = ""
        Dim sFederation As String = ""
        Dim sRankingScore As String = ""
        Dim sSkierRound As String = ""
        Dim sSkierEvent As String = ""
        Dim sSQL As String = ""
        Dim sLastUpdateDate As String = ""
        Dim sRound As Int16 = 0
        Dim sTmpRound As Int16 = 0
        Dim sTmpName As String = ""
        Dim sScore As String = ""
        Dim sEventClass As String = ""
        Dim sBuoys As String = ""
        Dim sPsLnLngth As String = ""
        Dim sNote As String = ""
        Dim sReride As String = ""
        Dim sProtected As String = ""
        Dim sRerideReason As String = ""
        Dim sHighlightRerideReason As String = ""
        ' 3 event scores in available data.
        ' 23S108, James Bryans,             OM, 000107150,  at least 1 round overall
        ' 23S108, Tristan Duplan-Fribourg, JM, 000181068, at least 1 round overall
        '       If sSkierEvent = "Slalom" Then
        sSQL = "Select SR.[Round], SR.Score, SR.PassLineLength, SR.Note, SR.Reride, SR.ScoreProt, SR.RerideReason, SS.Score as Buoys, SS.EventClass,  "
        sSQL += " TR.Federation, TR.City, Tr.State, ER.RankingScore, SR.LastUpdateDate "
        sSQL += " From LiveWebScoreboard.dbo.SlalomRecap SR "
        sSQL += " left join LiveWebScoreboard.dbo.SlalomScore SS On SR.SanctionID = SS.SanctionID And SR.MemberID = SS.MemberID "
        sSQL += " Left Join LiveWebScoreboard.dbo.TourReg TR on SR.SanctionID = TR.SanctionId And SR.MemberID = TR.MemberId "
        sSQL += " left join LiveWebScoreboard.dbo.EventReg ER on SR.sanctionID = ER.SanctionID and SR.MemberId = ER.MemberID "
        sSQL += "Where SR.SanctionId ='" & sSanctionID & "' AND  SR.MemberId='" & sMemberID & "' and SR.[Round] = SS.[Round] and ER.Event = 'Slalom'"
        sSQL += " Order By SR.[Round], SR.SkierRunNum ASC "
        '       End If
        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: RecapSlalom could not get connection string. "
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try

        Dim sLine As String = ""
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        sText = ""
        Dim cmdRead As New OleDb.OleDbCommand
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.Connection.Open()
                    cmdRead.CommandText = sSQL
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()



                            If IsDBNull(MyDataReader.Item("RankingScore")) Then
                                sRankingScore = " "
                            Else
                                sRankingScore = CStr(MyDataReader.Item("RankingScore"))
                            End If

                            If IsDBNull(MyDataReader.Item("City")) Then
                                sCity = " "
                            Else
                                sCity = CStr(MyDataReader.Item("City"))
                            End If

                            If IsDBNull(MyDataReader.Item("State")) Then
                                sState = " "
                            Else
                                sState = CStr(MyDataReader.Item("State"))
                            End If
                            If IsDBNull(MyDataReader.Item("Federation")) Then
                                sFederation = " "
                            Else
                                sFederation = UCase(MyDataReader.Item("Federation"))
                            End If
                            If IsDBNull(MyDataReader.Item("Buoys")) Then
                                sBuoys = "0"
                            Else
                                sBuoys = CStr(MyDataReader.Item("Buoys"))
                            End If
                            If IsDBNull(MyDataReader.Item("Score")) Then
                                sScore = "N/A"
                            Else
                                sScore = CStr(MyDataReader.Item("Score"))
                            End If

                            If IsDBNull(MyDataReader.Item("EventClass")) Then
                                sEventClass = "N/A"
                            Else
                                sEventClass = CStr(MyDataReader.Item("EventClass"))
                            End If


                            If IsDBNull(MyDataReader.Item("PassLineLength")) Then
                                sPsLnLngth = "N/A"
                            Else
                                sPsLnLngth = CStr(MyDataReader.Item("PassLineLength"))
                            End If

                            If IsDBNull(MyDataReader.Item("Note")) Then
                                sNote = "N/A"
                            Else
                                sNote = CStr(MyDataReader.Item("Note"))

                            End If
                            If IsDBNull(MyDataReader.Item("Reride")) Then
                                sReride = "N/A"
                            Else
                                sReride = CStr(MyDataReader.Item("Reride"))
                            End If
                            If IsDBNull(MyDataReader.Item("ScoreProt")) Then
                                sProtected = "N/A"
                            Else
                                sProtected = CStr(MyDataReader.Item("ScoreProt"))
                            End If
                            If IsDBNull(MyDataReader.Item("RerideReason")) Then
                                sRerideReason = ""
                            Else
                                sRerideReason = CStr(MyDataReader.Item("RerideReason"))
                            End If
                            If IsDBNull(MyDataReader.Item("Round")) Then
                                sRound = ""
                            Else
                                sRound = CStr(MyDataReader.Item("Round"))
                            End If
                            If IsDBNull(MyDataReader.Item("LastUpdateDate")) Then
                                sLastUpdateDate = ""
                            Else
                                sLastUpdateDate = CStr(MyDataReader.Item("LastUpdateDate"))
                            End If
                            If sTmpRound <> sRound Then
                                If sTmpRound > 0 Then
                                    sText += "</table><br/>"
                                End If

                                Dim roundText As String = If(sRound = 25, "Runoff", "Round " & sRound)
                                sText += "<h4>Slalom " & roundText & " - Class " & sEventClass & " " & sBuoys & " Buoy - " & sSkierName & " " & sAgeGroup & "</h4>"
                                sText += "<p>Ranking Score: " & sRankingScore & " | " & sCity & ", " & sState & " " & sFederation & "</p>"
                                sText += "<p style='margin-bottom: 1rem;'><em>Updated: " & sLastUpdateDate & "</em></p>"
                                sText += "<table class=""table table-striped"">"
                                sText += "<thead class=""table-dark"">"
                                sText += "<tr><th style=""width: 15%; font-size: 0.7rem;"">Score</th><th style=""width: 30%; font-size: 0.7rem;"">Pass Detail</th><th style=""width: 15%; font-size: 0.7rem;"">Reride</th><th style=""width: 25%; font-size: 0.7rem;"">Protected</th><th style=""width: 15%; font-size: 0.7rem;"">Class</th></tr>"
                                sText += "</thead><tbody>"
                                sTmpRound = sRound
                            End If
                            sText += "<tr><td>" & sScore & "</td><td>" & sNote & "</td><td>" & sReride & "</td><td>" & sProtected & "</td><td>" & sEventClass & "</td></tr>"
                            If sReride = "Y" Then
                                sHighlightRerideReason = " "
                                sText += "<tr><td " & sHighlightRerideReason & " colspan=""5"">At " & sPsLnLngth & "M Pass, Reride Reason " & sRerideReason & "</td></tr>"
                                sHighlightRerideReason = ""
                            End If
                        Loop
                        sText += "</tbody></table>"
                    Else
                        sText += "<p>No Slalom results found for selected skier.</p>"
                    End If 'end of has rows
                End Using

            Catch ex As Exception
                sMsg += "Error Can 't retrieve Slalom Scores. "
                sErrDetails = ex.Message & "<br> " & ex.StackTrace & "<br>""error at SRecapQry:SQL= " & sSQL
            End Try
        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        Return sText
    End Function

    Friend Function RecapTrick(ByVal SanctionID As String, ByVal MemberID As String, ByVal ageGroup As String, ByVal SkierName As String) As String
        'Pulled from wfwShowScoreRecap.php
        ' 
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sText As String = ""
        Dim sPassTable As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sMemberID As String = MemberID
        Dim sAgeGroup As String = ageGroup
        Dim sSkierName As String = SkierName
        Dim sSkierRound As String = ""
        Dim sSkierEvent As String = ""
        Dim sSQL As String = ""
        Dim sRound As Int16 = 0
        Dim sTmpRound As Int16 = 0
        Dim sPass As String = ""
        Dim sTmpPass As String = ""
        Dim sP1SubTotal As Int16 = 0
        Dim sP2SubTotal As Int16 = 0
        Dim sP1Score As String = ""
        Dim sRoundScore As String = ""
        Dim sP2Score As String = ""
        Dim sLastUpdateDate As String = ""
        Dim sTotalScore As Int16 = 0
        Dim sTrkScore As String = ""
        Dim sSkis As String = ""
        Dim sCode As String = ""
        Dim sResults As String = ""
        Dim sPass1URL As String = ""
        Dim sPass2URL As String = ""
        Dim sTmpPass1Url As String = ""
        Dim sTmpPass2URL As String = ""
        Dim sNextPass1URL As String = ""
        Dim sNextPass2URL As String = ""
        Dim MyStringBuilder As New StringBuilder
        'This query gives pass by pass detail, score per trick, pass score and round score
        MyStringBuilder.Append(" Select TP.[SanctionID], TP.[MemberId], TR.SkierName,TP.[AgeGroup],TP.[Round], ")
        MyStringBuilder.Append(" TP.[PassNum] as Pass, TP.Seq, TP.[Skis], TP.[Score] As TrkScore, TP.[Code], TP.[Results], ")
        MyStringBuilder.Append(" TS.ScorePass1 As P1Score, TS.ScorePass2 As P2Score, TS.Score As FScore, TP.[LastUpdateDate], ")
        MyStringBuilder.Append(" TS.EventClass, TV.Pass1VideoUrl, TV.Pass2VideoUrl ")
        MyStringBuilder.Append(" From [LiveWebScoreboard].[dbo].[TrickPass] TP  ")
        MyStringBuilder.Append(" Left Join(Select distinct SkierName, SanctionID, MemberID from LiveWebScoreboard.dbo.TourReg where sanctionID = '" & sSanctionID & "') as TR  ")
        MyStringBuilder.Append("  On TR.sanctionID = TP.SanctionID And TR.MemberID = TP.MemberID  ")
        MyStringBuilder.Append(" Left Join [LiveWebScoreboard].[dbo].TrickScore TS on TS.sanctionID = TP.SanctionID And TS.MemberID = TP.MemberID And TS.[round] = TP.[Round]  ")
        MyStringBuilder.Append(" LEFT OUTER JOIN [LiveWebScoreboard].dbo.TrickVideo AS TV ON TV.SanctionId = TR.SanctionId AND TV.MemberId = TR.MemberId ")
        MyStringBuilder.Append(" And TV.AgeGroup = TP.AgeGroup AND TV.Round = TP.Round ")

        MyStringBuilder.Append(" Where TP.SanctionId = '" & sSanctionID & "' and TP.MemberID = '" & sMemberID & "' ")
        MyStringBuilder.Append(" order by Round asc, Pass Asc, seq asc  ")
        sSQL = MyStringBuilder.ToString()

        '  sSQL = "Select * from vTrickResults  Where TP.SanctionId = '" & sSanctionID & "' and TP.MemberID = '" & sMemberID & "' order by Round asc, PassNum Asc  "

        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: RecapTrick could not get connection string."
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim sEventClass As String = ""
        Dim sLine As String = ""
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        sText = ""
        Dim cmdRead As New OleDb.OleDbCommand
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.Connection.Open()
                    cmdRead.CommandText = sSQL
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()
                            sSkierName = CStr(MyDataReader.Item("SkierName"))
                            sAgeGroup = CStr(MyDataReader.Item("AgeGroup"))
                            sSkis = CStr(MyDataReader.Item("Skis"))
                            sCode = CStr(MyDataReader.Item("Code"))
                            sPass = CStr(MyDataReader.Item("Pass"))
                            sResults = CStr(MyDataReader.Item("Results"))
                            sTrkScore = CStr(MyDataReader.Item("TrkScore"))
                            sRound = CStr(MyDataReader.Item("Round"))

                            If IsDBNull(MyDataReader.Item("FScore")) Then
                                sRoundScore = "N/A"
                            Else
                                sRoundScore = CStr(MyDataReader.Item("FScore"))
                            End If

                            If IsDBNull(MyDataReader.Item("EventClass")) Then
                                sEventClass = "N/A"
                            Else
                                sEventClass = CStr(MyDataReader.Item("EventClass"))
                            End If

                            If IsDBNull(MyDataReader.Item("P1Score")) Then
                                sP1Score = "N/A"
                            Else
                                sP1Score = CStr(MyDataReader.Item("P1Score"))
                            End If

                            If IsDBNull(MyDataReader.Item("P2Score")) Then
                                sP2Score = "N/A"
                            Else
                                sP2Score = CStr(MyDataReader.Item("P2Score"))
                            End If

                            If IsDBNull(MyDataReader.Item("Pass1VideoUrl")) Then
                                sPass1URL = ""
                            Else
                                sPass1URL = MyDataReader.Item("Pass1VideoUrl")
                            End If

                            If IsDBNull(MyDataReader.Item("Pass2VideoUrl")) Then
                                sPass2URL = ""
                            Else
                                sPass2URL = MyDataReader.Item("Pass2VideoUrl")
                            End If

                            If IsDBNull(MyDataReader.Item("LastUpdateDate")) Then
                                sLastUpdateDate = ""
                            Else
                                sLastUpdateDate = CStr(MyDataReader.Item("LastUpdateDate"))
                            End If

                            ' Check if we need to close a pass table when round changes
                            If sTmpRound <> sRound And sTmpPass <> "" Then
                                sText += "</tbody></table></div>" ' Close current pass table and column
                                sTmpPass = "" ' Reset pass tracking
                            End If

                            If sTmpRound <> sRound Then
                                If sTmpRound > 0 Then
                                    sText += "</div>" ' Close passes container

                                    ' Add videos for the previous round using stored URLs
                                    If sTmpPass1Url <> "" Then
                                        sText += "<div style=""margin: 10px 0;"">"
                                        sText += "<p><strong>Pass 1 Video:</strong></p>"
                                        sText += sTmpPass1Url
                                        sText += "</div>"
                                    End If
                                    If sTmpPass2URL <> "" Then
                                        sText += "<div style=""margin: 10px 0;"">"
                                        sText += "<p><strong>Pass 2 Video:</strong></p>"
                                        sText += sTmpPass2URL
                                        sText += "</div>"
                                    End If
                                    sText += "</div>"
                                End If

                                ' Store video URLs for this new round
                                sTmpPass1Url = sPass1URL
                                sTmpPass2URL = sPass2URL

                                Dim trickRoundText As String = If(sRound = 25, "Runoff", "Round " & sRound)
                                sText += "<div class=""trick-round-container"">"
                                sText += "<h4>Trick " & trickRoundText & " - Class " & sEventClass & " - Total Score: " & sRoundScore & "</h4>"
                                sText += "<p style='margin-bottom: 1rem;'><em>Updated: " & sLastUpdateDate & "</em></p>"

                                sText += "<div class=""trick-passes-container"">"

                                sTmpRound = sRound
                            End If

                            If sTmpPass <> sPass Then
                                If sTmpPass <> "" Then
                                    sText += "</tbody></table></div>"
                                End If

                                Dim passScore As String = If(sPass = "1", sP1Score, sP2Score)
                                sText += "<div class=""trick-pass-column"">"
                                sText += "<h5>Pass " & sPass & " - Score: " & passScore & "</h5>"
                                sText += "<table class=""trick-pass-table"">"
                                sText += "<thead>"
                                sText += "<tr><th>Skis</th><th>Code</th><th>Results</th><th>Pts</th></tr>"
                                sText += "</thead><tbody>"
                                sTmpPass = sPass
                            End If

                            sText += "<tr><td>" & sSkis & "</td><td>" & sCode & "</td><td>" & sResults & "</td><td>" & sTrkScore & "</td></tr>"
                        Loop

                        If sTmpPass <> "" Then
                            sText += "</tbody></table></div>"
                            sText += "</div>"

                            ' Add videos after the last round's score tables using stored URLs
                            If sTmpPass1Url <> "" Then
                                sText += "<div style=""margin: 10px 0;"">"
                                sText += "<p><strong>Pass 1 Video:</strong></p>"
                                sText += sTmpPass1Url
                                sText += "</div>"
                            End If
                            If sTmpPass2URL <> "" Then
                                sText += "<div style=""margin: 10px 0;"">"
                                sText += "<p><strong>Pass 2 Video:</strong></p>"
                                sText += sTmpPass2URL
                                sText += "</div>"
                            End If
                            sText += "</div>"
                        End If
                    Else
                        sText += "<p>No Trick results found for selected skier.</p>"
                    End If 'end of has rows
                End Using
            Catch ex As Exception
                sMsg += "Error Can't retrieve Trick Scores. "
                sErrDetails = "error at RecapTrick " & ex.Message & " " & ex.StackTrace & "<br>SQL= " & sSQL
            End Try
        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        Return sText
    End Function
    Friend Function RecapJump(ByVal SanctionID As String, ByVal MemberID As String, ByVal AgeGroup As String, ByVal SkierName As String) As String
        'Pulled from wfwShowScoreRecap.php
        ' 
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sText As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sMemberID As String = MemberID
        Dim sAgeGroup As String = AgeGroup
        Dim sSkierName As String = SkierName
        Dim sSkierRound As String = ""
        Dim sSkierEvent As String = ""
        Dim sEventClass As String = ""
        Dim sSQL As String = ""
        Dim sRound As Int16 = 0
        Dim sTmpRound As Int16 = 0
        Dim sTmpName As String = ""
        Dim sFeet As String = ""
        Dim sMeters As String = ""
        Dim sPass As String = ""
        Dim sBSpeed As String = ""
        Dim sRmpHt As String = ""
        Dim sNote As String = ""
        Dim sReride As String = ""
        Dim sProtected As String = ""
        Dim sRerideReason As String = ""
        Dim sResults As String = ""
        Dim sHighlightRerideReason As String = ""
        Dim sLastUpdateDate As String = ""

        ' 3 event scores in available data.
        ' 23S108, James Bryans,             OM, 000107150,  at least 1 round overall
        ' 23S108, Tristan Duplan-Fribourg, JM, 000181068, at least 1 round overall
        sSQL = "Select JR.SanctionID, JR.AgeGroup, JR.[round], JR.ScoreFeet, JR.ScoreMeters, JR.PassNum, JR.LastUpdateDate, "
        sSQL += " JR.Results, Jr.BoatSpeed, Jr.RampHeight, Jr.ScoreProt, JR.Reride, Jr.RerideReason, JS.EventClass "
        sSQL += " From JumpRecap JR "
        sSQL += " left join jumpscore JS on JR.Sanctionid = JS.SanctionID and JR.MemberID = JS.MemberID and JR.[Round] = JS.[Round]"
        sSQL += " Where JR.SanctionId ='" & sSanctionID & "' AND JR.MemberId='" & sMemberID & "' "
        sSQL += " Order By JR.[round], JR.PassNum ASC , ScoreFeet "

        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: JumpRecap could not get connection string. "
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim sLine As String = ""
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        sText = ""
        Dim cmdRead As New OleDb.OleDbCommand
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.Connection.Open()
                    cmdRead.CommandText = sSQL
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()
                            If IsDBNull(MyDataReader.Item("PassNum")) Then
                                sPass = "N/A"
                            Else
                                sPass = CStr(MyDataReader.Item("PassNum"))
                            End If

                            If IsDBNull(MyDataReader.Item("EventClass")) Then
                                sEventClass = "N/A"
                            Else
                                sEventClass = CStr(MyDataReader.Item("EventClass"))
                            End If

                            If IsDBNull(MyDataReader.Item("Results")) Then
                                sResults = "N/A"
                            Else
                                sResults = MyDataReader.Item("Results")
                            End If

                            If IsDBNull(MyDataReader.Item("ScoreFeet")) Then
                                sFeet = "N/A"
                            Else
                                sFeet = CStr(MyDataReader.Item("ScoreFeet"))
                            End If
                            If IsDBNull(MyDataReader.Item("ScoreMeters")) Then
                                sMeters = "N/A"
                            Else
                                sMeters = CStr(MyDataReader.Item("ScoreMeters"))
                            End If
                            If IsDBNull(MyDataReader.Item("AgeGroup")) Then
                                sAgeGroup = "N/A"
                            Else
                                sAgeGroup = CStr(MyDataReader.Item("AgeGroup"))
                            End If
                            If IsDBNull(MyDataReader.Item("BoatSpeed")) Then
                                sBSpeed = "N/A"
                            Else
                                sBSpeed = CStr(MyDataReader.Item("BoatSpeed"))
                            End If
                            If IsDBNull(MyDataReader.Item("RampHeight")) Then
                                sRmpHt = "N/A"
                            Else
                                sRmpHt = CStr(MyDataReader.Item("RampHeight"))
                            End If
                            If IsDBNull(MyDataReader.Item("Reride")) Then
                                sReride = "N"
                            Else
                                sReride = CStr(MyDataReader.Item("Reride"))
                            End If
                            If IsDBNull(MyDataReader.Item("ScoreProt")) Then
                                sProtected = "N/A"
                            Else
                                sProtected = CStr(MyDataReader.Item("ScoreProt"))
                            End If
                            If IsDBNull(MyDataReader.Item("RerideReason")) Then
                                sRerideReason = ""
                            Else
                                sRerideReason = CStr(MyDataReader.Item("RerideReason"))
                            End If
                            If IsDBNull(MyDataReader.Item("Round")) Then
                                sRound = "N/A"
                            Else
                                sRound = CStr(MyDataReader.Item("Round"))
                            End If
                            If IsDBNull(MyDataReader.Item("LastUpdateDate")) Then
                                sLastUpdateDate = ""
                            Else
                                sLastUpdateDate = CStr(MyDataReader.Item("LastUpdateDate"))
                            End If
                            If sTmpRound <> sRound Then
                                If sText <> "" Then
                                    sText += "</tbody></table>"
                                End If
                                Dim jumpRoundText As String = If(sRound = 25, "Runoff", "Round " & sRound)
                                sText += "<h4 style='margin-bottom: 1rem;'>Jump " & jumpRoundText & " - " & sEventClass & " Class</h4>"
                                sText += "<table class=""table table-striped table-bordered"">"
                                sText += "<thead><tr><th style=""width: 14.3%; font-size: 0.7rem;"">Result</th><th style=""width: 14.3%; font-size: 0.7rem;"">Pass</th><th style=""width: 14.3%; font-size: 0.7rem;"">Distance</th><th style=""width: 14.3%; font-size: 0.7rem;"">Speed</th><th style=""width: 14.3%; font-size: 0.7rem;"">Ramp Height</th><th style=""width: 14.3%; font-size: 0.7rem;"">Reride</th><th style=""width: 14.3%; font-size: 0.7rem;"">Protected</th></tr></thead>"
                                sText += "<tbody>"
                                sTmpRound = sRound
                            End If
                            sText += "<tr><td>" & sResults & "</td><td>" & sPass & "</td><td>" & sFeet & " ft / " & sMeters & " m</td><td>" & sBSpeed & "</td><td>" & sRmpHt & "</td><td>" & sReride & "</td><td>" & sProtected & "</td></tr>"
                            If sReride = "Y" Then
                                sText += "<tr><td colspan=""7"" style=""font-style: italic; color: #6c757d;"">Pass " & sPass & " reride reason: " & sRerideReason & "</td></tr>"
                            End If

                        Loop
                        If sText <> "" Then
                            sText += "</tbody></table>"
                        End If
                    Else
                        sText += "<p>No Jump results found for selected skier.</p>"
                    End If 'end of has rows
                End Using

            Catch ex As Exception
                sMsg += "Error Can 't retrieve Jump Recap. "
                sErrDetails = ex.Message & " " & ex.StackTrace & "error at RecapJump:SQL= " & sSQL
            End Try
        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        Return sText
    End Function

    Friend Function RecapOverall(ByVal SanctionID As String, ByVal MemberID As String, ByVal SkierName As String) As String
        'Pulled from wfwShowScoreRecap.php
        ' 
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sText As String = ""
        Dim sTitleLine As String = ""
        Dim sDataLine As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sMemberID As String = MemberID
        Dim sAgeGroup As String = ""
        Dim sSkierName As String = SkierName
        '       Replace(sSkierName, "'", "''")
        '        Replace(sSkierName, ",", ",,")
        Dim sSkierRound As String = ""
        Dim sSkierEvent As String = ""
        Dim sSQL As String = ""
        Dim sRound As Int16 = 0
        Dim sTmpRound As Int16 = 0
        Dim sEvent As String = ""
        Dim sOverallScore As String = ""
        Dim sSlalomNopsScore As String = ""
        Dim sTrickNopsScore As String = ""
        Dim sJumpNopsScore As String = ""
        Dim sSlalomScore As String = ""
        Dim sFinalPassScore As String = ""
        Dim sFinalSpeedMPH As String = ""
        Dim sFinalspeedKPH As String = ""
        Dim sFinalLen As String = ""
        Dim sFinalLenOff As String = ""
        Dim sTrickScore As String = ""
        Dim sScorePass1 As String = ""
        Dim sScorePass2 As String = ""
        Dim sScoreFeet As String = ""
        Dim sScoreMeters As String = ""
        Dim sNotOverall As String = ""


        sSQL = "select * from vOverallResults where SanctionID ='" & sSanctionID & "'  and OverallScore > 0 and MemberID = '" & sMemberID & "'"

        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: RecapOverall could not get connection string. "
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim sEventClass As String = ""
        Dim sLine As String = ""
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        sText = ""
        Dim cmdRead As New OleDb.OleDbCommand
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.Connection.Open()
                    cmdRead.CommandText = sSQL
                    MyDataReader = cmdRead.ExecuteReader
                    sText += "<h4 style='margin-bottom: 1rem;'>Overall Scores</h4>"
                    sText += "<table class=""table table-striped table-bordered"">"
                    sText += "<thead><tr><th style=""font-size: 0.7rem;"">Age Group</th><th style=""font-size: 0.7rem;"">Round</th><th style=""font-size: 0.7rem;"">Overall Score</th><th style=""font-size: 0.7rem;"">Slalom NOPS</th><th style=""font-size: 0.7rem;"">Trick NOPS</th><th style=""font-size: 0.7rem;"">Jump NOPS</th></tr></thead>"
                    sText += "<tbody>"

                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()
                            ' Get AgeGroup from the data
                            If Not IsDBNull(MyDataReader.Item("AgeGroup")) Then
                                sAgeGroup = CStr(MyDataReader.Item("AgeGroup"))
                            End If

                            If IsDBNull(MyDataReader.Item("Round")) Then
                                sRound = "N/A"
                            Else
                                sRound = CStr(MyDataReader.Item("Round"))
                            End If
                            If IsDBNull(MyDataReader.Item("Event")) Then
                                sEvent = "N/A"
                            Else
                                sEvent = CStr(MyDataReader.Item("Event"))
                            End If
                            If IsDBNull(MyDataReader.Item("OverallScore")) Then
                                sOverallScore = "N/A"
                            Else
                                sOverallScore = CStr(MyDataReader.Item("OverallScore"))
                            End If
                            If IsDBNull(MyDataReader.Item("SlalomNopsScore")) Then
                                sSlalomNopsScore = "N/A"
                            Else
                                sSlalomNopsScore = CStr(MyDataReader.Item("SlalomNopsScore"))
                            End If
                            If IsDBNull(MyDataReader.Item("TrickNopsScore")) Then
                                sTrickNopsScore = "N/A"
                            Else
                                sTrickNopsScore = CStr(MyDataReader.Item("TrickNopsScore"))
                            End If
                            If IsDBNull(MyDataReader.Item("JumpNopsScore")) Then
                                sJumpNopsScore = "N/A"
                            Else
                                sJumpNopsScore = CStr(MyDataReader.Item("JumpNopsScore"))
                            End If
                            If IsDBNull(MyDataReader.Item("SlalomScore")) Then
                                sSlalomScore = "N/A"
                            Else
                                sSlalomScore = CStr(MyDataReader.Item("SlalomScore"))
                            End If
                            If IsDBNull(MyDataReader.Item("FinalPassScore")) Then
                                sFinalPassScore = "N/A"
                            Else
                                sFinalPassScore = CStr(MyDataReader.Item("FinalPassScore"))
                            End If
                            If IsDBNull(MyDataReader.Item("FinalSpeedMPH")) Then
                                sFinalSpeedMPH = "N/A"
                            Else
                                sFinalSpeedMPH = CStr(MyDataReader.Item("FinalSpeedMPH"))
                            End If
                            If IsDBNull(MyDataReader.Item("FinalSpeedKPH")) Then
                                sFinalspeedKPH = "N/A"
                            Else
                                sFinalspeedKPH = CStr(MyDataReader.Item("FinalspeedKPH"))
                            End If
                            If IsDBNull(MyDataReader.Item("FinalLen")) Then
                                sFinalLen = "N/A"
                            Else
                                sFinalLen = CStr(MyDataReader.Item("FinalLen"))
                            End If
                            If IsDBNull(MyDataReader.Item("FinalLenOff")) Then
                                sFinalLenOff = "N/A"
                            Else
                                sFinalLenOff = CStr(MyDataReader.Item("FinalLenOff"))
                            End If
                            If IsDBNull(MyDataReader.Item("TrickScore")) Then
                                sTrickScore = "N/A"
                            Else
                                sTrickScore = CStr(MyDataReader.Item("TrickScore"))
                            End If
                            If IsDBNull(MyDataReader.Item("ScorePass1")) Then
                                sScorePass1 = "N/A"
                            Else
                                sScorePass1 = CStr(MyDataReader.Item("ScorePass1"))
                            End If
                            If IsDBNull(MyDataReader.Item("ScorePass2")) Then
                                sScorePass2 = "N/A"
                            Else
                                sScorePass2 = CStr(MyDataReader.Item("ScorePass2"))
                            End If
                            If IsDBNull(MyDataReader.Item("ScoreFeet")) Then
                                sScoreFeet = "N/A"
                            Else
                                sScoreFeet = CStr(MyDataReader.Item("ScoreFeet"))
                            End If
                            If IsDBNull(MyDataReader.Item("ScoreMeters")) Then
                                sScoreMeters = "N/A"
                            Else
                                sScoreMeters = CStr(MyDataReader.Item("ScoreMeters"))
                            End If

                            sText += "<tr><td>" & sAgeGroup & "</td><td>" & sRound & "</td><td><strong>" & sOverallScore & "</strong></td><td>" & sSlalomNopsScore & "</td><td>" & sTrickNopsScore & "</td><td>" & sJumpNopsScore & "</td></tr>"

                        Loop
                    Else
                        sText += "<tr><td colspan=""6"">No Overall results found for selected skier.</td></tr>"
                    End If 'end of has rows
                    sText += "</tbody></table>"
                End Using

            Catch ex As Exception
                sMsg += "Error Can't retrieve Overall Scores. " 'SQL= " & SQL & "<br>IndivJumpResults Caught: <br />" & ex.Message & " " & ex.StackTrace & "<br>"
                sErrDetails = ex.Message & " " & ex.StackTrace & "<br>error at RecapOverall:  SQL= " & sSQL
                sText += "</tbody></table>"
            Finally

            End Try
        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        Return sText
    End Function



    Friend Function IndivSlalomResults(ByVal SanctionID As String, ByVal MemberID As String, ByVal SkierName As String) As String
        'Not used after v3.1.5 - switched to use Recaps
        Dim sReturn As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sMemberID As String = MemberID

        Dim SQL As String = ""
        SQL = "SELECT * from dbo.vSlalomResults Where SanctionID ='" & sSanctionID & "' And MemberID = '" & Trim(sMemberID) & "' ORDER BY AgeGroup, MemberID, Round "
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSkierName As String = SkierName
        Dim sAgeGroup As String = ""
        Dim sEvent As String = ""
        Dim sEventScore As String = ""
        Dim sRound As String = ""
        Dim sEventScoreDesc As String = ""
        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sErrDetails = " IndivSlalomResults could not get connection string." & ex.Message & "  " & ex.StackTrace
            sMsg = "Error: No connection string"
            Return sMsg
            Exit Function
        End Try
        Dim sEventClass As String = ""
        Dim sLine As String = ""
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim sText As String = ""
        Dim sTSB As New StringBuilder
        sTSB.Append("<Table Class=""table table-striped border-1 "">")
        sTSB.Append("<thead><tr class=""table-primary""><th colspan=""5""><span class=""bg-danger text-white"" > <b>! UNOFFICIAL !</b></span> Slalom Results for " & sSkierName & " </th></tr>")
        sTSB.Append("<tr><th>DV</th><th>Class</th><th>Rnd</th><th>Buoys</th><th>Detail</th></tr></thead>")
        Dim cmdRead As New OleDb.OleDbCommand
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.CommandText = SQL
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()

                            sSanctionID = CStr(MyDataReader.Item("SanctionID"))
                            sSkierName = CStr(MyDataReader.Item("SkierName"))
                            sAgeGroup = CStr(MyDataReader.Item("AgeGroup"))
                            If IsDBNull(MyDataReader.Item("EventScore")) Then
                                sEventScore = "0"
                            Else
                                sEventScore = CStr(MyDataReader.Item("EventScore"))
                            End If
                            sEventClass = CStr(MyDataReader.Item("EventClass"))

                            If IsDBNull(MyDataReader.Item("Round")) Then
                                sRound = "N/A"
                            Else
                                sRound = CStr(MyDataReader.Item("Round"))
                            End If

                            If IsDBNull(MyDataReader.Item("EventScoreDesc")) Then
                                sEventScoreDesc = "N/A"
                            Else
                                sEventScoreDesc = CStr(MyDataReader.Item("EventScoreDesc"))
                            End If


                            sTSB.Append("<tr><td>" & sAgeGroup & "&nbsp;</td><td>" & sEventClass & "&nbsp;</td><td>" & sRound & "&nbsp;</td><td>" & sEventScore & "&nbsp; </td><td>" & sEventScoreDesc & "</td></tr>")

                        Loop
                    Else
                        sTSB.Append("<tr><td colspan=""5"">No Scores Found for " & sSkierName & ".</td></tr>")
                    End If 'end of has rows
                End Using
            Catch ex As Exception
                sMsg = "Error: at IndivSlalomResults "
                sErrDetails += ex.Message & " " & ex.StackTrace & "SQL= " & SQL
            Finally
                sText = sTSB.ToString() & "</table>"
            End Try
        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        Return sText
    End Function

    Friend Function IndivJumpResults(ByVal SanctionID As String, ByVal MemberID As String, ByVal SkierName As String) As String
        'Not used after v3.1.5 - switched to use Recaps
        Dim sReturn As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sMemberID As String = MemberID


        Dim SQL As String = ""
        SQL = "SELECT * from dbo.vJumpResults "
        SQL += " Where SanctionID ='" & sSanctionID & "' And MemberID = '" & Trim(sMemberID) & "'"
        SQL += "  ORDER BY AgeGroup, MemberID, Round "
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSkierName As String = SkierName
        Dim sAgeGroup As String = ""
        Dim sEvent As String = ""
        Dim sEventScore As String = ""
        Dim sRound As String = ""
        Dim sEventScoreDesc As String = ""
        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: IndivJumpResults could not get connection string. "
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim sEventClass As String = ""
        Dim sLine As String = ""
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim sText As String = ""
        Dim sTSB As New StringBuilder
        sTSB.Append("<Table Class=""table table-striped border-1 "">")
        sTSB.Append("<thead><tr Class=""table-primary""><td colspan=""5""><span class=""bg-danger text-white"">UNOFFICIAL</span>Jump Results for " & sSkierName & "</td></tr>")
        sTSB.Append("<tr><th>DV</th><th>Class</th><th>Rnd</th><th>Distance</th><th>Detail</th></tr></thead>")

        Dim cmdRead As New OleDb.OleDbCommand
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.CommandText = SQL
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()

                            sSanctionID = CStr(MyDataReader.Item("SanctionID"))
                            sSkierName = CStr(MyDataReader.Item("SkierName"))
                            sAgeGroup = CStr(MyDataReader.Item("AgeGroup"))
                            sEventClass = CStr(MyDataReader.Item("EventClass"))
                            sEventScore = CStr(MyDataReader.Item("EventScore"))
                            sRound = CStr(MyDataReader.Item("Round"))
                            sEventScoreDesc = CStr(MyDataReader.Item("EventScoreDesc"))

                            sTSB.Append("<tr><td>" & sAgeGroup & "&nbsp;</td><td>" & sEventClass & "&nbsp;</td><td>" & sRound & "&nbsp;</td><td>" & sEventScore & "&nbsp;</td><td>" & sEventScoreDesc & "</td></tr>")

                        Loop
                    Else
                        sTSB.Append("<tr><td colspan=""5"">No Scores Found for selected skier.</td></tr>")
                    End If 'end of has rows
                End Using
            Catch ex As Exception
                sMsg += "Error: Can't retrieve Jump Scores. "
                sErrDetails = ex.Message & " " & ex.StackTrace & "<br>SQL = " & SQL
            Finally
                sText = sTSB.ToString() & "</table>"
            End Try
        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        Return sText
    End Function
    Friend Function IndivTrickResults(ByVal SanctionID As String, ByVal MemberID As String, ByVal SkierName As String) As String
        'Not used after v3.1.5 - switched to use Recaps
        Dim sReturn As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sMemberID As String = MemberID
        Dim SQL As String = ""
        SQL = "SELECT * from LiveWebScoreboard.dbo.vTrickResults "
        SQL += " Where SanctionID ='" & sSanctionID & "' And MemberID = '" & Trim(sMemberID) & "'"
        SQL += "  ORDER BY AgeGroup, MemberID, Round "
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSkierName As String = SkierName
        Dim sAgeGroup As String = ""
        Dim sPass1URL As String = ""
        Dim sPass2URL As String = ""
        Dim sEvent As String = ""
        Dim sEventScore As String = ""
        Dim sRound As String = ""
        Dim sEventScoreDesc As String = ""
        Dim sPassNum As String = "0"
        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: IndivTrickResults could not get connection string."
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim sEventClass As String = ""
        Dim sLine As String = ""
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim sTableWidth As String = "100%"
        Dim sText As String = ""
        Dim sTSB As New StringBuilder
        sTSB.Append("<Table Class=""table table-striped border-1 "">")
        sTSB.Append("<thead><tr Class=""table-primary""><td colspan=""5""><span class=""bg-danger text-white"">UNOFFICIAL</span> Trick Results for " & sSkierName & "</td></tr>")
        sTSB.Append("<tr>><th>DV</th><th>Class</th><th>Rnd</th><th>Points</th><th>Detail</th></tr></thead>")
        Dim cmdRead As New OleDb.OleDbCommand
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.CommandText = SQL
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()

                            sSanctionID = CStr(MyDataReader.Item("SanctionID"))
                            sSkierName = CStr(MyDataReader.Item("SkierName"))
                            sAgeGroup = CStr(MyDataReader.Item("AgeGroup"))
                            sEventClass = CStr(MyDataReader.Item("EventClass"))
                            sEventScore = CStr(MyDataReader.Item("EventScore"))
                            sRound = CStr(MyDataReader.Item("Round"))
                            sEventScoreDesc = CStr(MyDataReader.Item("EventScoreDesc"))
                            If IsDBNull(MyDataReader.Item("Pass1VideoURL")) Then
                                sPass1URL = "Round " & sRound & " Pass 1 Video Not available."
                            Else
                                sPass1URL = MyDataReader.Item("Pass1VideoURL")
                            End If
                            If IsDBNull(MyDataReader.Item("Pass2VideoURL")) Then
                                sPass2URL = "Round " & sRound & " Pass 2 Video Is Not available."
                            Else
                                sPass2URL = MyDataReader.Item("Pass2VideoURL")
                            End If
                            sTSB.Append("<tr><td>" & sAgeGroup & "&nbsp;</td></td><td>" & sEventClass & "&nbsp;;</td><td>" & sRound & "&nbsp;</td><td>" & sEventScore & "&nbsp;</td><td>" & sEventScoreDesc & "</td></tr>")
                            sTSB.Append("<tr><td colspan=""5"">" & sPass1URL & "</td></tr>")
                            sTSB.Append("<tr><td colspan=""5"">" & sPass2URL & "</td></tr>")

                        Loop
                    Else
                        sTSB.Append("<tr><td colspan=""5"">No Scores Found For selected skier.</td></tr>")
                    End If 'end of has rows
                End Using
            Catch ex As Exception
                sMsg += "Error: Can't retrieve Trick Scores"
                sErrDetails = ex.Message & " " & ex.StackTrace & "<br>SQL = " & SQL
            Finally
                sText = sTSB.ToString() & "</table>"
            End Try
        End Using
        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        Return sText
    End Function

    Public Function GetReportList(ByVal SanctionID As String) As String
        'Produce comma separated list of divisions included by selected Event and round
        Dim sReturn As String = ""
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sReportTitle As String = ""
        Dim sReportFileUri As String = ""
        Dim sSql As String = "PrGetPublishReports"
        Dim sReportType As String = ""
        Dim sTmpReportType As String = ""
        Dim sEvent As String = ""
        Dim sTmpEvent As String = ""

        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: GetReportList could not get connection string."
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try

        ' First pass: collect all data and organize by report type + event
        Dim reportData As New Dictionary(Of String, List(Of Tuple(Of String, String)))
        Dim headers As New List(Of String)

        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim cmdRead As New OleDb.OleDbCommand
        cmdRead.CommandType = CommandType.StoredProcedure
        cmdRead.CommandText = sSql
        cmdRead.Parameters.Add("@InSanctionID", OleDb.OleDbType.VarChar)
        cmdRead.Parameters("@InSanctionID").Size = 6
        cmdRead.Parameters("@InSanctionID").Value = sSanctionID
        cmdRead.Parameters("@InSanctionID").Direction = ParameterDirection.Input

        cmdRead.Parameters.Add("@InReportType", OleDb.OleDbType.VarChar)
        cmdRead.Parameters("@InReportType").Size = 12
        cmdRead.Parameters("@InReportType").Value = "PDF"
        cmdRead.Parameters("@InReportType").Direction = ParameterDirection.Input

        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Using Cnnt
            Try
                Using cmdRead
                    cmdRead.Connection = Cnnt
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows = True Then
                        Do While MyDataReader.Read()
                            If Not IsDBNull(MyDataReader.Item("ReportTitle")) Then
                                sReportTitle = CStr(MyDataReader.Item("ReportTitle"))
                            Else
                                sReportTitle = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("ReportFileUri")) Then
                                sReportFileUri = CStr(MyDataReader.Item("ReportFileUri"))
                            Else
                                sReportFileUri = ""
                            End If
                            If Not IsDBNull(MyDataReader.Item("ReportType")) Then
                                sReportType = CStr(MyDataReader.Item("ReportType"))
                            Else
                                sReportType = "N/A"
                            End If
                            If Not IsDBNull(MyDataReader.Item("Event")) Then
                                sEvent = CStr(MyDataReader.Item("Event"))
                            Else
                                sEvent = "N/A"
                            End If

                            ' Create column key
                            Dim columnKey As String = sReportType & " - " & sEvent
                            If Not headers.Contains(columnKey) Then
                                headers.Add(columnKey)
                            End If

                            ' Add to data collection
                            If Not reportData.ContainsKey(columnKey) Then
                                reportData(columnKey) = New List(Of Tuple(Of String, String))
                            End If
                            reportData(columnKey).Add(New Tuple(Of String, String)(sReportTitle, sReportFileUri))
                        Loop
                    End If
                End Using
            Catch ex As Exception
                sMsg = "Error at GetReportList"
                sErrDetails = sMsg & " " & ex.Message & " " & ex.StackTrace
            End Try
        End Using

        ' Build the table
        Dim sList As New StringBuilder
        If headers.Count > 0 Then
            sList.Append("<table class=""table table-striped border-1"" style=""width: auto; margin: 2rem auto;"">")

            sList.Append("<thead><tr style=""background-color: #d6eded !important;"">")
            For Each header As String In headers
                sList.Append("<th><b>" & header & "</b></th>")
            Next
            sList.Append("</tr></thead>")

            ' Find maximum number of reports in any column
            Dim maxReports As Integer = 0
            For Each kvp In reportData
                If kvp.Value.Count > maxReports Then
                    maxReports = kvp.Value.Count
                End If
            Next

            sList.Append("<tbody>")
            For i As Integer = 0 To maxReports - 1
                sList.Append("<tr>")
                For Each header As String In headers
                    sList.Append("<td>")
                    If reportData.ContainsKey(header) AndAlso i < reportData(header).Count Then
                        Dim report = reportData(header)(i)
                        sList.Append("<a href=""" & report.Item2 & """ target=""_blank"">" & report.Item1 & "</a>")
                    Else
                        sList.Append("&nbsp;")
                    End If
                    sList.Append("</td>")
                Next
                sList.Append("</tr>")
            Next
            sList.Append("</tbody>")
            sList.Append("</table>")
        Else
            sList.Append("<table class=""table table-striped border-1"" style=""width: auto; margin: 2rem auto;"">")
            sList.Append("<tr><td>No Reports found for " & sSanctionID & "</td></tr>")
            sList.Append("</table>")
        End If
        If Len(sMsg) > 2 Then
            Return sMsg
        Else
            sReturn = sList.ToString()
            Return sReturn
        End If
    End Function


    Public Function GetRunOrdercount(ByVal SanctionID As String, ByVal SlalomRound As String, ByVal TrickRounds As String, ByVal JumpRnds As String) As Array
        'Check for multiple running orders by event
        'Return an array that provides the events with multiple running orders.
        'For each event - Use that info to display either the single running order for all rounds or a separate running order for each round
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sSlalomRnds As String = SlalomRound
        Dim sTrickRnds As String = TrickRounds
        Dim sJumpRnds As String = JumpRnds
        Dim sRnd As String = ""
        Dim sEventGrp As String = ""
        Dim sReturnArray(0 To 4)
        Dim sSQLS As String = ""
        Dim sSQLT As String = ""
        Dim sSQLJ As String = ""
        Dim sMultiS As String = "0"
        Dim sMultiT As String = "0"
        Dim sMultiJ As String = "0"

        If sSlalomRnds > 0 Then
            '            sSQLS = "Select distinct EventGroup, [round] From livewebscoreboard.dbo.EventRunOrder Where SanctionId = '" & sSanctionID & "' AND Event = 'Slalom' "
            sSQLS = " Select distinct ERO.EventGroup, ERO.[round], Upper(TP.PropValue) From livewebscoreboard.dbo.EventRunOrder ERO "
            sSQLS += " Left Join livewebscoreboard.dbo.TourProperties TP On ERO.SanctionID = TP.SanctionID "
            sSQLS += " where ERO.SanctionID = '" & sSanctionID & "' and ERO.Event = 'Slalom' and TP.PropKey = 'SlalomSummaryDataType' "
        End If
        If sTrickRnds > 0 Then
            sSQLT = " Select distinct ERO.EventGroup, ERO.[round], Upper(TP.PropValue) From livewebscoreboard.dbo.EventRunOrder ERO "
            sSQLT += " Left Join livewebscoreboard.dbo.TourProperties TP On ERO.SanctionID = TP.SanctionID "
            sSQLT += " where ERO.SanctionID = '" & sSanctionID & "' and ERO.Event = 'Trick' and TP.PropKey = 'TrickSummaryDataType' "

        End If
        If sJumpRnds > 0 Then
            sSQLJ = " Select distinct ERO.EventGroup, ERO.[round], Upper(TP.PropValue) From livewebscoreboard.dbo.EventRunOrder ERO "
            sSQLJ += " Left Join livewebscoreboard.dbo.TourProperties TP On ERO.SanctionID = TP.SanctionID "
            sSQLJ += " where ERO.SanctionID = '" & sSanctionID & "' and ERO.Event = 'Jump' and TP.PropKey = 'JumpSummaryDataType' "
        End If

        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: GetReportList could not get connection string."
            sErrDetails = ex.Message & "  " & ex.StackTrace
            sReturnArray(0) = sMsg
            Return sReturnArray
            Exit Function
        End Try

        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim cmdRead As New OleDb.OleDbCommand
        cmdRead.CommandType = CommandType.Text
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Dim sCkRows As Boolean = False
        Using Cnnt
            Try

                Using cmdRead
                    cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                    cmdRead.Connection.Open()
                    If Len(sSQLS) > 2 Then
                        cmdRead.CommandText = sSQLS
                        MyDataReader = cmdRead.ExecuteReader
                        If MyDataReader.HasRows = True Then
                            sMultiS = "1"
                        End If
                        MyDataReader.Close()
                    End If

                    If Len(sSQLT) > 2 Then
                        cmdRead.CommandText = sSQLT
                        MyDataReader = cmdRead.ExecuteReader
                        If MyDataReader.HasRows = True Then
                            sMultiT = "1"
                        End If
                        MyDataReader.Close()
                    End If

                    If Len(sSQLJ) > 2 Then
                        cmdRead.CommandText = sSQLJ
                        MyDataReader = cmdRead.ExecuteReader
                        If MyDataReader.HasRows = True Then
                            sMultiJ = "1"
                        End If
                        MyDataReader.Close()
                    End If

                End Using

            Catch ex As Exception
                sMsg = "Error at GetBestRndXEvDv"
                sErrDetails = sMsg & " " & ex.Message & " " & ex.StackTrace
                sReturnArray(0) = sMsg
            End Try
        End Using
        sReturnArray(1) = sMultiS
        sReturnArray(2) = sMultiT
        sReturnArray(3) = sMultiJ
        Return sReturnArray
    End Function

    Public Function GetRunOrderXRnd(ByVal SanctionID As String, ByVal YrPkd As String, ByVal TName As String, ByVal selEvent As String, ByVal selDivision As String, ByVal RndPkd As String, ByVal RndsSlalomOffered As String, ByVal RndsTrickOffered As String, ByVal RndsJumpOffered As String, ByVal UseNOPS As Int16, ByVal UseTeams As Int16, ByVal FormatCode As String, ByVal DisplayMetric As Int16) As String
        ' Called from TROxRnd.aspx when One or more rounds use different running orders and ALL rounds is selected.
        ' Calls appropriate functions to create tables to be passed back up.
        ' 'Produces Master table which includes separate tables for each round with name, dv, and score
        ' 'If A single round is specified  - Produces One table with specified round and enhanced horizontal display
        'Division, Event, and EventGroup can be individually specified
        'Provisiion included but not implemented to specify NOPS (0 or 1), TEAMS (0 or 1), Display Metric (0 = no, 1 = yes, 2 = display imperial and metric)
        Dim sMsg As String = ""
        Dim sErrMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sYrPkd As String = YrPkd
        Dim sTournName As String = TName
        Dim sDivisionCodePkd As String = selDivision
        Dim sSlalomRounds As String = RndsSlalomOffered
        Dim sTrickRounds As String = RndsTrickOffered
        Dim sJumpRounds As String = RndsJumpOffered
        Dim sEventPkd As String = selEvent
        Dim sSlalomRnds As String = RndsSlalomOffered
        Dim sTrickRnds As String = RndsTrickOffered
        Dim sJumpRnds As String = RndsJumpOffered
        Dim sUseNops As Int16 = UseNOPS
        Dim sUseTeams As Int16 = UseTeams
        Dim sFormatCode As String = FormatCode
        Dim sDisplayMetric As Int16 = DisplayMetric
        Dim sSelRnd As Int16 = 0
        Dim sRndPkd As Int16 = RndPkd
        Dim sMaxRnds As Int16 = 0
        Dim sSQL As String = ""
        Dim sColInnerHTML As New StringBuilder
        'GENERATE SEPARATE TABLES FOR EACH ROUND WITH PROPER HEADERS
        Select Case sEventPkd
            Case "S"
                If sRndPkd = 0 Then
                    For sSelRnd = 1 To sSlalomRnds
                        sMsg = ModDataAccess3.ScoresXMultiRunOrdHoriz(sSanctionID, sYrPkd, sTournName, "S", sDivisionCodePkd, sSelRnd, sSlalomRounds, sTrickRounds, sJumpRounds, sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
                        If Left(sMsg, 5) <> "Error" Then
                            sColInnerHTML.Append(sMsg)
                        Else
                            sErrMsg += sMsg
                        End If
                    Next
                Else
                    sMsg = ModDataAccess3.ScoresXMultiRunOrdHoriz(sSanctionID, sYrPkd, sTournName, "S", sDivisionCodePkd, sRndPkd, sSlalomRounds, sTrickRounds, sJumpRounds, sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
                    If Left(sMsg, 5) <> "Error" Then
                        sColInnerHTML.Append(sMsg)
                    End If
                End If
            Case "T"

                If sRndPkd = 0 Then
                    For sSelRnd = 1 To sSlalomRnds
                        sMsg = ModDataAccess3.ScoresXMultiRunOrdHoriz(sSanctionID, sYrPkd, sTournName, "T", sDivisionCodePkd, sSelRnd, sSlalomRounds, sTrickRounds, sJumpRounds, sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
                        If Left(sMsg, 5) <> "Error" Then
                            sColInnerHTML.Append(sMsg)
                        Else
                            sErrMsg += sMsg
                        End If
                    Next
                Else
                    sMsg = ModDataAccess3.ScoresXMultiRunOrdHoriz(sSanctionID, sYrPkd, sTournName, "T", sDivisionCodePkd, sRndPkd, sSlalomRounds, sTrickRounds, sJumpRounds, sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
                    If Left(sMsg, 5) <> "Error" Then
                        sColInnerHTML.Append(sMsg)
                    End If
                End If
            Case "J"
                If sRndPkd = 0 Then
                    For sSelRnd = 1 To sSlalomRnds
                        sMsg = ModDataAccess3.ScoresXMultiRunOrdHoriz(sSanctionID, sYrPkd, sTournName, "J", sDivisionCodePkd, sSelRnd, sSlalomRounds, sTrickRounds, sJumpRounds, sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
                        If Left(sMsg, 5) <> "Error" Then
                            sColInnerHTML.Append(sMsg)
                        Else
                            sErrMsg += sMsg
                        End If
                    Next
                Else
                    sMsg = ModDataAccess3.ScoresXMultiRunOrdHoriz(sSanctionID, sYrPkd, sTournName, "J", sDivisionCodePkd, sRndPkd, sSlalomRounds, sTrickRounds, sJumpRounds, sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
                    If Left(sMsg, 5) <> "Error" Then
                        sColInnerHTML.Append(sMsg)
                    End If
                End If
        End Select



        If Len(sErrMsg) > 2 Then
            Return sErrMsg
            Exit Function
        End If
        Return sColInnerHTML.ToString()
    End Function
    Public Function ScoresXMultiRunOrdHoriz(ByVal SanctionID As String, ByVal YrPkd As String, ByVal TName As String, ByVal selEvent As String, ByVal selDivision As String, ByVal selRnd As String, ByVal RndsSlalomOffered As String, ByVal RndsTrickOffered As String, ByVal RndsJumpOffered As String, ByVal UseNOPS As Int16, ByVal UseTeams As Int16, ByVal FormatCode As String, ByVal DisplayMetric As Int16) As String
        'Call this function event where multiple running orders are used and all rounds are to be displayed
        ' Sanction number and event are used to produce the page.
        ' The other variables passed in are used to provide navigation information when skier name is clicked and TRecap is opened.
        ' Code to handle indivisual round is left in but should never be reached.

        Dim sReturn As String = ""
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim sSanctionID As String = SanctionID
        Dim sYrPkd As String = YrPkd
        Dim sPREventCode As String = selEvent
        Dim sSelRnd As String = selRnd
        Dim sSelDivision As String = selDivision
        Dim sDisplayMetric As Int16 = DisplayMetric
        Dim sSelFormat As String = "Best"
        '       Dim sUseNOPS As Int16 = 0
        '       Dim sShowTeams As Int16 = 0
        Dim sSkierName As String = ""
        Dim sMemberID As String = ""
        Dim sEventScoreDesc As String = ""
        Dim sEventScoreDescMetric As String = ""
        Dim sEventScoreDescImperial As String = ""
        Dim stmpMemberID As String = ""
        Dim i As Int16 = 0
        Dim j As Int16 = 0
        Dim k As Int16 = 0
        Dim sDv As String = ""
        Dim sTmpDV As String = ""
        Dim sEventClass As String = ""
        Dim sEventGroup As String = ""
        Dim sTmpEventGroup As String = ""
        Dim sEventScore As String = ""
        Dim sRnd As String = ""
        Dim sRunOrd As New StringBuilder
        Dim sTName As String = TName
        Dim sRoundsHTML As String = ""
        Dim sLine As New StringBuilder
        Dim sRndsSlalomOffered As String = RndsSlalomOffered
        Dim sRndsTrickOffered As String = RndsTrickOffered
        Dim sRndsJumpOffered As String = RndsJumpOffered
        Dim sRndsThisEvent As String = ""
        Dim sRndCols As String = 0
        Dim sSkierLink As String = ""
        Dim sRndCount As Int16 = 0
        Dim sPassCount As Int16 = 1
        Dim sRankingScore As String = ""
        Dim sReadyForPlcmt As String = ""
        Dim sSql As String = ""

        Select Case selEvent
            Case "S"
                sPREventCode = "Slalom"
                sSql = "PrSlalomScoresByRunOrder"
                sRndsThisEvent = sRndsSlalomOffered
                If sSelRnd = "0" Then   ' All Rounds
                    sRndCols = CStr(CInt(sRndsSlalomOffered))
                    j = 1
                    k = CInt(sRndsSlalomOffered)
                    '                    For j = 1 To RndsSlalomOffered
                    '                        sRoundsHTML += "<td  Class=""table-primary"">Rnd " & j & "</td>"
                    '                    Next
                Else 'This should never be reached.
                    j = selRnd
                    k = selRnd
                    sRoundsHTML += "<td>Rnd " & sSelRnd & "</td>"
                    sRndCols = "1"
                End If
            Case "T"
                sPREventCode = "Trick"
                sSql = "PrTrickScoresByRunOrder"
                sRndsThisEvent = sRndsTrickOffered
                If sSelRnd = "0" Then
                    sRndCols = CStr(CInt(sRndsTrickOffered))  'Rnds + name + 2 for BestRnd
                    j = 1
                    k = CInt(sRndsTrickOffered)
                    '                For j = 1 To RndsTrickOffered
                    '                    sRoundsHTML += "<td  Class=""table-primary"">Rnd " & j & "</td>"
                    '                Next
                Else
                    j = selRnd
                    k = selRnd
                    sRoundsHTML += "<td>Rnd " & sSelRnd & "</td>"
                    sRndCols = "1"
                End If
            Case "J"
                sPREventCode = "Jump"
                sSql = "PrJumpScoresByRunOrder"
                sRndsThisEvent = sRndsJumpOffered

                If sSelRnd = "0" Then
                    sRndCols = CStr(CInt(sRndsJumpOffered))  'Rnds + name + 2 for BestRnd
                    j = 1
                    k = CInt(sRndsJumpOffered)
                    '                    For j = 1 To RndsJumpOffered
                    '                        sRoundsHTML += "<td  Class=""table-primary"">Rnd " & j & "</td>"
                    '                    Next
                Else
                    j = selRnd
                    k = selRnd
                    sRoundsHTML += "<td>Rnd " & sSelRnd & "</td>"
                    sRndCols = "1"
                End If
            Case Else  'Load all by default
                sMsg += "Overall not available"
                Return sMsg
                Exit Function
        End Select
        Dim sEventTable As New StringBuilder
        Dim sRoundTable As New StringBuilder
        Dim compactClass As String = If(CInt(sRndCols) >= 3, " compact", "")

        sEventTable.Append("<div>")
        sEventTable.Append("<div class=""multi-running-order-container"">")
        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: GetRunOrder could not get connection string."
            sErrDetails = ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try

        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim cmdRead As New OleDb.OleDbCommand
        Using Cnnt
            '           For sRndCount = 1 To sRndCols
            For sRndCount = j To k
                cmdRead.CommandType = CommandType.StoredProcedure
                cmdRead.CommandText = sSql
                cmdRead.Parameters.Clear()
                cmdRead.Parameters.Add("@InSanctionID", OleDb.OleDbType.VarChar)
                cmdRead.Parameters("@InSanctionID").Size = 6
                cmdRead.Parameters("@InSanctionID").Value = sSanctionID
                cmdRead.Parameters("@InSanctionID").Direction = ParameterDirection.Input

                '       cmdRead.Parameters.Add("@InEvCode", OleDb.OleDbType.VarChar)
                '       cmdRead.Parameters("@InEvCode").Size = 12
                '       cmdRead.Parameters("@InEvCode").Value = sPREventCode
                '       cmdRead.Parameters("@InEvCode").Direction = ParameterDirection.Input

                cmdRead.Parameters.Add("@InRnd", OleDb.OleDbType.Char)
                cmdRead.Parameters("@InRnd").Size = 1
                cmdRead.Parameters("@InRnd").Value = sRndCount    '0 = All Rounds    sSelRnd
                cmdRead.Parameters("@InRnd").Direction = ParameterDirection.Input

                cmdRead.Parameters.Add("@InDV", OleDb.OleDbType.VarChar)
                cmdRead.Parameters("@InDV").Size = 3
                cmdRead.Parameters("@InDV").Value = sSelDivision  'sDv
                cmdRead.Parameters("@InDV").Direction = ParameterDirection.Input

                cmdRead.Parameters.Add("@InGroup", OleDb.OleDbType.VarChar)
                cmdRead.Parameters("@InGroup").Size = 3
                cmdRead.Parameters("@InGroup").Value = "ALL"   'sEventGroup  Don't have a droplist for Event Group so always all
                cmdRead.Parameters("@InGroup").Direction = ParameterDirection.Input

                Dim MyDataReader As OleDb.OleDbDataReader = Nothing
                Dim sCkRows As Boolean = False
                Try
                    Using cmdRead
                        cmdRead.Connection = Cnnt 'New OleDbConnection(sConn)
                        If sPassCount = 1 Then 'Only open connection on first pass through
                            cmdRead.Connection.Open()
                            sPassCount = 0
                        End If
                        MyDataReader = cmdRead.ExecuteReader
                        If MyDataReader.HasRows = True Then
                            Do While MyDataReader.Read()
                                sSkierName = CStr(MyDataReader.Item("SkierName"))

                                If Not IsDBNull(MyDataReader.Item("DiV")) Then
                                    sDv = CStr(MyDataReader.Item("DiV"))
                                Else
                                    sDv = ""
                                End If

                                If Not IsDBNull(MyDataReader.Item("EventClass")) Then
                                    sEventClass = MyDataReader.Item("EventClass")
                                Else
                                    sEventClass = ""
                                End If

                                If Not IsDBNull(MyDataReader.Item("EventGroup")) Then
                                    sEventGroup = MyDataReader.Item("EventGroup")
                                Else
                                    sEventGroup = ""
                                End If

                                If Not IsDBNull(MyDataReader.Item("MemberID")) Then
                                    sMemberID = MyDataReader.Item("MemberID")
                                Else
                                    sMemberID = ""
                                End If
                                If sPREventCode = "Slalom" Then
                                    Select Case sDisplayMetric
                                        Case 0
                                            If Not IsDBNull(MyDataReader.Item("EventScoreDescImperial")) Then
                                                sEventScoreDesc = MyDataReader.Item("EventScoreDescImperial")
                                            Else
                                                sEventScoreDesc = ""
                                            End If
                                        Case 1
                                            If Not IsDBNull(MyDataReader.Item("EventScoreDescMeteric")) Then
                                                sEventScoreDesc = MyDataReader.Item("EventScoreDescMeteric")
                                            Else
                                                sEventScoreDesc = ""
                                            End If
                                        Case Else
                                            If Not IsDBNull(MyDataReader.Item("EventScoreDesc")) Then
                                                sEventScoreDesc = MyDataReader.Item("EventScoreDesc")
                                            Else
                                                sEventScoreDesc = ""
                                            End If
                                    End Select
                                Else  'Jump and Trick do not have EventScoreDescImperial and EventScoreDescMetric fields
                                    If Not IsDBNull(MyDataReader.Item("EventScoreDesc")) Then
                                        sEventScoreDesc = MyDataReader.Item("EventScoreDesc")
                                    Else
                                        sEventScoreDesc = ""
                                    End If
                                End If
                                If Not IsDBNull(MyDataReader.Item("EventScore")) Then
                                    sEventScore = MyDataReader.Item("EventScore")
                                Else
                                    sEventScore = ""
                                End If
                                If Not IsDBNull(MyDataReader.Item("Round")) Then
                                    sRnd = MyDataReader.Item("Round")
                                Else
                                    sRnd = 0
                                End If
                                If Not IsDBNull(MyDataReader.Item("RankingScore")) Then
                                    sRankingScore = MyDataReader.Item("RankingScore")
                                Else
                                    sRankingScore = ""
                                End If

                                sReadyForPlcmt = ""
                                If Not IsDBNull(MyDataReader.Item("ReadyForPlcmt")) Then
                                    If MyDataReader.Item("ReadyForPlcmt") <> "Y" Then
                                        sReadyForPlcmt = "&nbsp;<span class=""class-logo class-x"" title=""NOT for placement"">X</span>"
                                    End If
                                End If

                                ' Have data line
                                Dim rankingDisplayMulti As String = If(sRankingScore <> "", " <small>(RS: " & sRankingScore & ")</small>", "")
                                sSkierLink = "<a runat=""server""  href=""Trecap?SID=" & sSanctionID & "&SY=" & sYrPkd & "&MID=" & sMemberID & "&DV=" & sDv & "&EV=" & selEvent & ""
                                sSkierLink += "&FC=RO&FT=1&RP=0&UN=0&UT=0&TN=" & sTName & "&SN=" & sSkierName & """ ><b>" & sSkierName & "</b></a>" & rankingDisplayMulti & sReadyForPlcmt

                                If sTmpEventGroup = "" Then 'set up first event group
                                    sTmpEventGroup = sEventGroup
                                    'Make event group header - create individual table for this round
                                    Dim innerCompactClass As String = If(CInt(sRndCols) >= 3, " class=""compact""", "")
                                    sRoundTable.Append("<table" & innerCompactClass & " class=""table table-striped"">")
                                    sRoundTable.Append("<thead><tr><th colspan=""2"" style=""background-color: #15274D !important; color: white; text-align: center;"">" & sPREventCode & " Round " & sRndCount & ", " & sEventGroup & "</th></tr></thead><tbody>")
                                End If

                                If sTmpDV = "" Then
                                    sTmpDV = sDv
                                End If
                                'First skier in first event group or other skiers in current event group
                                If sTmpEventGroup = sEventGroup Then 'Same Event Group continue with skier lines
                                    If sEventScoreDesc <> "" Then
                                        sRoundTable.Append("<tr><td style=""width: 40%;"">" & sSkierLink & "</td><td style=""width: 60%;""><b>" & sDv & " - " & sEventScoreDesc & "</b></td></tr>")
                                    Else
                                        sRoundTable.Append("<tr><td style=""width: 40%;"">" & sSkierLink & "</td><td style=""width: 60%;""><b>" & sDv & "</b></td></tr>")
                                    End If

                                Else 'Make new event group header
                                    sRoundTable.Append("<tr><td colspan=""2"" style=""background-color: #d6eded; font-weight: bold; text-align: center; padding: 0.3rem;"">Event Group: " & sEventGroup & "</td></tr>")
                                    'Add current skier
                                    If sEventScoreDesc <> "" Then
                                        sRoundTable.Append("<tr><td style=""width: 40%;"">" & sSkierLink & "</td><td style=""width: 60%;""><b>" & sDv & " - " & sEventScoreDesc & "</b></td></tr>")
                                    Else
                                        sRoundTable.Append("<tr><td style=""width: 40%;"">" & sSkierLink & "</td><td style=""width: 60%;""><b>" & sDv & "</b></td></tr>")
                                    End If
                                    'Reset the variables
                                    sTmpEventGroup = sEventGroup
                                End If
                            Loop
                            'End of round - close out round table and add to container
                            sRoundTable.Append("</tbody></table>")
                            sEventTable.Append(sRoundTable.ToString())
                            sRoundTable.Clear()

                        Else 'No data
                            sRoundTable.Append("<table" & If(CInt(sRndCols) >= 3, " class=""compact""", "") & " class=""table table-striped"">")
                            sRoundTable.Append("<thead><tr><th style=""background-color: #15274D !important; color: white; text-align: center;"">" & sPREventCode & " Round " & sRndCount & "</th></tr></thead>")
                            sRoundTable.Append("<tbody><tr><td>No " & sPREventCode & " Skiers Found</td></tr></tbody></table>")
                            sEventTable.Append(sRoundTable.ToString())
                            sRoundTable.Clear()
                        End If
                        MyDataReader.Close()  'have to close datareader before reusing with same command name
                    End Using

                Catch ex As Exception
                    sMsg = "Error at GetRunOrder"
                    sErrDetails = sMsg & " " & ex.Message & " " & ex.StackTrace
                End Try
                'Reset variables for new pass
                sMemberID = ""
                sTmpEventGroup = ""
                sTmpDV = ""
            Next
            'finished the round loop - close out container divs
            sEventTable.Append("</div></div>")  ' Close multi-running-order-container and outer div
        End Using  'End CnnT
        If Len(sMsg) > 2 Then
            Return sMsg
            Exit Function
        End If
        Dim sdebug As String = sEventTable.ToString()
        Return sEventTable.ToString()
    End Function


    ' Searches tournaments by keyword in Name or EventLocation
    Public Function SearchTournamentsByKeyword(ByVal keyword As String) As String
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim SQL As String = ""
        Dim sKeyword As String = "%" & keyword & "%"
        SQL = "SELECT SanctionID, Name, Class, Format(cast(EventDates As Date), 'yyyyMMdd') AS FormattedDate, EventDates, EventLocation, Rules FROM Tournament " &
              "WHERE (Name LIKE ? OR EventLocation LIKE ?) AND ISDATE(EventDates) = 1 " &
              "ORDER BY FormattedDate DESC"
        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            sMsg = "Error: Can not access data"
            sErrDetails = "Error: SearchTournamentsByKeyword could not retrieve connection string. " & ex.Message & "  " & ex.StackTrace
            Return sMsg
            Exit Function
        End Try
        Dim Cnnt As New OleDb.OleDbConnection(sConn)
        Dim sHTML As New StringBuilder("")
        sHTML.Append("<table class='table table-striped border-1'>")
        Dim cmdRead As New OleDb.OleDbCommand
        Dim MyDataReader As OleDb.OleDbDataReader = Nothing
        Try
            Using Cnnt
                Using cmdRead
                    cmdRead.Connection = Cnnt
                    cmdRead.CommandText = SQL
                    cmdRead.Parameters.AddWithValue("?", sKeyword)      ' First ? for Name LIKE
                    cmdRead.Parameters.AddWithValue("?", sKeyword)      ' Second ? for EventLocation LIKE
                    cmdRead.Connection.Open()
                    MyDataReader = cmdRead.ExecuteReader
                    If MyDataReader.HasRows Then
                        Do While MyDataReader.Read()
                            Dim sSanctionID As String = CStr(MyDataReader.Item("SanctionID"))
                            Dim sName As String = CStr(MyDataReader.Item("Name"))
                            Dim sEventDates As String = Format(CDate(MyDataReader.Item("EventDates")), "MM/dd/yyyy")
                            Dim sEventLocation As String = MyDataReader.Item("EventLocation")
                            sHTML.Append("<tr>" &
                                "<td></td>" &
                                "<td><a runat=""server"" href=""Tournament.aspx?SN=" & sSanctionID & "&FM=1&SY=0""><b>" & sName & "</b></a>" &
                                "<b> " & sEventDates & " " & sSanctionID & "</b> " & sEventLocation & "</td>" &
                                "</tr>")
                        Loop
                    Else
                        sHTML.Append("<tr><td>No tournaments found matching your search.</td></tr>")
                    End If
                End Using
            End Using
        Catch ex As Exception
            sMsg = "Error: searching tournaments by keyword. "
            sErrDetails = ex.Message & " " & ex.StackTrace & "<br>SQL= " & SQL
            sMsg += sErrDetails
            Return sMsg
        End Try
        sHTML.Append("</table>")
        Return sHTML.ToString()
    End Function

    Public Function LoadDvData(ByVal sanctionId As String, ByVal eventCode As String) As List(Of Object)
        Dim divisions As New List(Of Object)
        Dim sSQL As String = "PrGetUsedAgeGroups"
        Dim sPREventCode As String = ""

        Select Case eventCode.ToUpper()
            Case "S"
                sPREventCode = "Slalom"
            Case "T"
                sPREventCode = "Trick"
            Case "J"
                sPREventCode = "Jump"
            Case "O"
                sPREventCode = "Overall"
            Case Else
                sPREventCode = "All"
        End Select

        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If

            Using Cnnt As New OleDb.OleDbConnection(sConn)
                Using cmdRead As New OleDb.OleDbCommand
                    cmdRead.CommandType = CommandType.StoredProcedure
                    cmdRead.CommandText = sSQL
                    cmdRead.Parameters.Add("@InSanctionId", OleDb.OleDbType.VarChar, 6).Value = sanctionId
                    cmdRead.Parameters.Add("@InEvent", OleDb.OleDbType.VarChar, 12).Value = sPREventCode
                    cmdRead.Connection = Cnnt
                    Cnnt.Open()

                    Using reader As OleDb.OleDbDataReader = cmdRead.ExecuteReader()
                        While reader.Read()
                            If Not IsDBNull(reader("AgeGroup")) Then
                                divisions.Add(New With {
                                    .code = reader("AgeGroup").ToString(),
                                    .name = reader("AgeGroup").ToString()
                                })
                            End If
                        End While
                    End Using
                End Using
            End Using
        Catch ex As Exception
            ' Return empty list on error
        End Try

        Return divisions
    End Function

    Public Function GetDvMostRecent(ByVal sanctionId As String, ByVal eventCode As String) As List(Of Object)
        Dim divisions As New List(Of Object)

        ' Custom SQL to get event-division combinations ordered by most recent scoring activity
        Dim sSQL As String = ""

        ' Filter by specific event if provided
        If eventCode = "S" Then
            sSQL = "SELECT 'S' as Event, AgeGroup, MAX(InsertDate) as MaxDate " &
                   "FROM SlalomScore WHERE sanctionID = ? GROUP BY AgeGroup ORDER BY MaxDate DESC"
        ElseIf eventCode = "T" Then
            sSQL = "SELECT 'T' as Event, AgeGroup, MAX(InsertDate) as MaxDate " &
                   "FROM TrickScore WHERE sanctionID = ? GROUP BY AgeGroup ORDER BY MaxDate DESC"
        ElseIf eventCode = "J" Then
            sSQL = "SELECT 'J' as Event, AgeGroup, MAX(InsertDate) as MaxDate " &
                   "FROM JumpScore WHERE sanctionID = ? GROUP BY AgeGroup ORDER BY MaxDate DESC"
        Else
            '  get all events
            sSQL = "SELECT 'S' as Event, AgeGroup, MAX(InsertDate) as MaxDate " &
                   "FROM SlalomScore WHERE sanctionID = ? GROUP BY AgeGroup " &
                   "UNION " &
                   "SELECT 'T' as Event, AgeGroup, MAX(InsertDate) as MaxDate " &
                   "FROM TrickScore WHERE sanctionID = ? GROUP BY AgeGroup " &
                   "UNION " &
                   "SELECT 'J' as Event, AgeGroup, MAX(InsertDate) as MaxDate " &
                   "FROM JumpScore WHERE sanctionID = ? GROUP BY AgeGroup " &
                   "ORDER BY MaxDate DESC"
        End If

        Dim sConn As String = ""
        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If

            Using Cnnt As New OleDb.OleDbConnection(sConn)
                Using cmdRead As New OleDb.OleDbCommand(sSQL, Cnnt)
                    If eventCode = "S" Or eventCode = "T" Or eventCode = "J" Then
                        ' Single event
                        cmdRead.Parameters.AddWithValue("@p1", sanctionId)
                    Else
                        ' All events
                        cmdRead.Parameters.AddWithValue("@p1", sanctionId)
                        cmdRead.Parameters.AddWithValue("@p2", sanctionId)
                        cmdRead.Parameters.AddWithValue("@p3", sanctionId)
                    End If
                    Cnnt.Open()

                    Using reader As OleDb.OleDbDataReader = cmdRead.ExecuteReader()
                        While reader.Read()
                            If Not IsDBNull(reader("Event")) AndAlso Not IsDBNull(reader("AgeGroup")) Then
                                divisions.Add(New With {
                                    .event = reader("Event").ToString(),
                                    .division = reader("AgeGroup").ToString()
                                })
                            End If
                        End While
                    End Using
                End Using
            End Using
        Catch ex As Exception
        End Try
        Return divisions
    End Function

    Public Function GetRecentScores(ByVal sanctionId As String, Optional ByVal maxScores As Integer = 20, Optional ByVal offsetRows As Integer = 0) As List(Of Object)
        ' Call stored procedure PrGetMostRecentScores
        Dim recentScores As New List(Of Object)
        Dim sConn As String = ""

        Try
            If ConfigurationManager.ConnectionStrings("S_UseLocal_Scoreboard").ConnectionString = 0 Then
                sConn = ConfigurationManager.ConnectionStrings("LWS_Prod").ConnectionString
            Else
                sConn = ConfigurationManager.ConnectionStrings("Local_SS_WP23").ConnectionString
            End If
        Catch ex As Exception
            Return recentScores
        End Try

        Using connection As New OleDb.OleDbConnection(sConn)
            Using command As New OleDb.OleDbCommand("EXEC LiveWebScoreboard.dbo.PrGetMostRecentScores @InSanctionId = ?, @InLastMinuteCheck = ?", connection)
                command.Parameters.Add("@InSanctionId", OleDb.OleDbType.VarChar).Value = sanctionId
                command.Parameters.Add("@InLastMinuteCheck", OleDb.OleDbType.Integer).Value = 0

                Try
                    connection.Open()
                    Using reader As OleDb.OleDbDataReader = command.ExecuteReader()
                        While reader.Read()
                            ' Build result object as Dictionary for JSON serialization
                            Dim item As New Dictionary(Of String, Object)
                            item("event") = If(IsDBNull(reader("Event")), "", reader("Event").ToString())
                            item("skierName") = If(IsDBNull(reader("SkierName")), "", reader("SkierName").ToString())
                            item("insertDate") = If(IsDBNull(reader("InsertDate")), DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ss"), Convert.ToDateTime(reader("InsertDate")).ToString("yyyy-MM-ddTHH:mm:ss"))
                            item("division") = If(IsDBNull(reader("Div")), "", reader("Div").ToString())
                            item("round") = If(IsDBNull(reader("Round")), 1, Convert.ToInt32(reader("Round")))
                            item("sanctionId") = If(IsDBNull(reader("SanctionId")), "", reader("SanctionId").ToString())
                            item("memberId") = If(IsDBNull(reader("MemberId")), "", reader("MemberId").ToString())
                            item("eventScoreDesc") = If(IsDBNull(reader("EventScoreDesc")), "", reader("EventScoreDesc").ToString())
                            recentScores.Add(item)
                        End While
                    End Using
                Catch ex As Exception
                    ' Return empty list on error
                End Try
            End Using
        End Using

        Return recentScores
    End Function

End Module
